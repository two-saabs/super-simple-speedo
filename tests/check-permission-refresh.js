#!/usr/bin/env node
'use strict';
// Characterise all three shipped refresh paths together. Mock only the Capacitor
// APIs and clock; execute native-ios.js and the actual page scripts in DOM order.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { settingsHarness } = require('./helpers/settings-harness');
const html = fs.readFileSync(process.argv[2] || 'index.template.html', 'utf8');
const adapter = fs.readFileSync(path.join(__dirname, '..', 'native-ios.js'), 'utf8')
  .replace(/^import .*;\n/gm, '');
assert.equal((html.match(/id="ios-location-state-refresh-v1"/g) || []).length, 1,
  'exactly one ongoing Settings permission refresh script');

async function harness({ native = true, seen = false } = {}) {
  let time = 0, timerId = 0, status = 'prompt', failCheck = false;
  const timers = new Map(), checks = [], requests = [], launches = [], watches = [];
  const h = await settingsHarness(html, { native, beforeScripts(w) {
    if (seen) w.localStorage.setItem('frenanoLocationIntroSeenV1', '1');
    w.setTimeout = (fn, delay = 0) => {
      const id = ++timerId;
      timers.set(id, { fn, at: time + delay });
      return id;
    };
    w.clearTimeout = id => timers.delete(id);
    w.requestAnimationFrame = () => 0; // unrelated layout diagnostic
    w.console = { log() {}, warn() {} };
    if (!native) return;
    w.__permissionTestPlatform = {
      Geolocation: {
        async checkPermissions() {
          checks.push(time);
          if (failCheck) throw Error('native permission check unavailable');
          return { location: status };
        },
        async requestPermissions(options) {
          requests.push(JSON.parse(JSON.stringify(options)));
          status = 'granted';
          return { location: status };
        },
        async watchPosition(options, callback) {
          watches.push({ options, callback });
          return 'native-watch';
        },
        async clearWatch() {}
      },
      AppLauncher: { async openUrl(options) { launches.push(options.url); } },
      StatusBar: { async show() {}, async setOverlaysWebView() {}, async setStyle() {}, async getInfo() { return {}; } },
      Style: { Dark: 'DARK' }
    };
    // Imports are replaced by controlled platform APIs; the adapter body is intact.
    w.eval(`(() => { const { Geolocation, AppLauncher, StatusBar, Style } = window.__permissionTestPlatform;\n${adapter}\n})();`);
  }});
  async function advance(ms) {
    const end = time + ms;
    while (true) {
      const next = [...timers.entries()].filter(([, t]) => t.at <= end)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      time = next[1].at;
      timers.delete(next[0]);
      next[1].fn();
      await h.settle();
    }
    time = end;
  }
  return { ...h, checks, requests, launches, watches, advance,
    now: () => time,
    status(value) { status = value; },
    failCheck(value) { failCheck = value; },
    resetChecks() { checks.length = 0; },
    visibility(value) { Object.defineProperty(h.d, 'visibilityState', { value, configurable: true }); }
  };
}

async function run() {
  for (const seen of [false, true]) {
    const h = await harness({ seen });
    try {
      assert.deepEqual(h.checks, [0, 0, 0], 'two Settings queries plus adapter DOMContentLoaded query');
      assert.equal(h.requests.length, 0, 'refresh does not request permission');
      assert.equal(h.$('nativeLocationPermissionStatus'), null, 'legacy adapter display target remains absent');
      assert.equal(h.$('locationPermissionAction').textContent, 'Manage');
      // Finish any existing returning-native startup timer before isolating events.
      await h.advance(200);
      h.resetChecks(); h.status('denied');
      let start = h.now();
      h.$('settingsButton').click(); await h.settle();
      assert.deepEqual(h.checks, [start], 'Settings-open immediate refresh');
      assert.equal(h.$('locationPermissionLabel').textContent, 'Off in Settings');
      assert.equal(h.$('locationPermissionAction').textContent, 'Manage', 'label-only renderer leaves action stale');
      await h.advance(0);
      assert.deepEqual(h.checks, [start, start], 'legacy adapter 0 ms refresh retained');
      await h.advance(179); assert.equal(h.checks.length, 2);
      await h.advance(1); assert.deepEqual(h.checks, [start, start, start + 180]);
      h.$('locationPermissionAction').click(); await h.settle();
      assert.deepEqual(h.launches, ['app-settings:'], 'Manage retains native Settings action');

      h.resetChecks(); h.visibility('hidden');
      await h.event(h.d, 'visibilitychange'); await h.advance(200);
      assert.deepEqual(h.checks, [], 'hidden document does not refresh');
      h.visibility('visible'); start = h.now();
      await h.event(h.d, 'visibilitychange');
      assert.deepEqual(h.checks, [start, start, start], 'Settings, label-only and adapter immediate refreshes');
      assert.equal(h.$('locationPermissionAction').textContent, 'Open Settings');
      await h.advance(179); assert.equal(h.checks.length, 3);
      await h.advance(1); assert.deepEqual(h.checks, [start, start, start, start + 180]);

      h.resetChecks(); h.status('granted'); start = h.now();
      await h.event(h.w, 'focus');
      assert.deepEqual(h.checks, []);
      await h.advance(79); assert.equal(h.checks.length, 0);
      await h.advance(1); assert.deepEqual(h.checks, [start + 80]);
      assert.equal(h.$('locationPermissionLabel').textContent, 'On — Frenano can use your location');
      assert.equal(h.$('locationPermissionAction').textContent, 'Open Settings', 'focus does not consolidate action state');
      h.resetChecks(); start = h.now();
      await h.event(h.w, 'pageshow');
      assert.deepEqual(h.checks, [start], 'pageshow still belongs to Settings');
      assert.equal(h.$('locationPermissionAction').textContent, 'Manage');

      for (const [status, label] of [
        ['prompt', 'Off — location is needed to measure your speed'],
        ['prompt-with-rationale', 'Off — location is needed to measure your speed'],
        ['unknown', 'Checking location…']
      ]) {
        h.status(status); await h.event(h.w, 'focus'); await h.advance(80);
        assert.equal(h.$('locationPermissionLabel').textContent, label);
        assert.ok(!h.$('locationPermissionStatus').classList.contains('granted'));
        assert.ok(!h.$('locationPermissionStatus').classList.contains('denied'));
      }
      h.failCheck(true); await h.event(h.w, 'focus'); await h.advance(80);
      assert.equal(h.$('locationPermissionLabel').textContent, 'Checking location…');
      assert.equal(h.requests.length, 0, 'all refresh paths remain check-only');

      // Real adapter permission request and watch forwarding remain separate.
      h.failCheck(false); h.status('prompt'); h.resetChecks();
      let received;
      const id = h.w.__SPEEDO_NATIVE_GEOLOCATION__.watchPosition(p => { received = p; }, assert.fail, { timeout: 10000 });
      await h.settle();
      assert.deepEqual(h.requests, [{ permissions: ['location'] }]);
      assert.equal(h.checks.length, 2, 'adapter checks before and after requesting');
      assert.equal(h.watches.length, 1);
      const position = { coords: { speed: 12 } };
      h.watches[0].callback(position); assert.equal(received, position);
      h.w.__SPEEDO_NATIVE_GEOLOCATION__.clearWatch(id);
    } finally { h.close(); }
  }
  const web = await harness({ native: false });
  try {
    const label = web.$('locationPermissionLabel').textContent;
    web.$('settingsButton').click();
    await web.event(web.w, 'focus'); await web.event(web.d, 'visibilitychange'); await web.advance(180);
    assert.deepEqual(web.checks, [], 'iOS synchronisation is inert on web');
    assert.equal(web.calls.refresh, 0);
    assert.equal(web.$('locationPermissionLabel').textContent, label);
    assert.equal(web.$('locationPermissionAction').textContent, 'How to change');
  } finally { web.close(); }
  console.log('PASS combined permission refresh: real adapter, initialization, immediate/0/180/80 ms calls, label-only state, web guard and request/watch separation');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
