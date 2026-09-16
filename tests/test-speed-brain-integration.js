'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the generated app's actual callback, transport recovery, rendering and
// reset functions. Only platform/UI/network effects are substituted. This is not
// a full DOM or physical GPS test; the frozen profile suite owns algorithm replay.
function functionSource(html, name) {
  const start = html.search(new RegExp(`^  (?:async )?function ${name}\\(`, 'm'));
  assert.notEqual(start, -1, `generated app contains ${name}`);
  return html.slice(start, html.indexOf('\n  }', start) + 4);
}

function harness(html) {
  const elements = new Map(), timers = new Map(), logs = [], effects = [], saves = [];
  let nextTimer = 1, now = 1000000;
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, { textContent: '', style: {}, dataset: {}, classList: {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle: (name, active) => active ? classes.add(name) : classes.delete(name)
      } });
    }
    return elements.get(id);
  }
  const state = {
    watchId: 1, lastAcceptedSpeed: 0, targetSpeed: 0, displayedSpeed: 0,
    driverModeActive: false, driverExitTimer: null, lastDriverUiLogState: false,
    statisticsEnabled: true, stats: { maxSpeed: 0, metres: 0, trips: 0 },
    points: [], lastStatsPosition: null, transitSpeedRecoverySamples: [],
    transitCandidate: null, transportGuess: { mode: 'unknown', confidence: 0 },
    roadServiceStatus: 'ready', mode: 'manual', apiKey: 'test-key', limit: null
  };
  const sandbox = {
    state, window: {}, startupGpsPending: false, startupGpsFinished: false,
    startupGpsAttemptId: 1, localStorage: { getItem: key => key === 'speedUnits' ? 'mph' : null },
    Date: class extends Date { static now() { return now; } },
    $: element, document: { body: element('body'), querySelector: element },
    statusEl: element('status'), speedEl: element('speed'), sourceEl: element('source'),
    roadEl: element('road'), startEl: element('start'),
    addDiagnostic: entry => { logs.push(entry); effects.push({ type: entry.event || 'SPEED', accepted: state.lastAcceptedSpeed, target: state.targetSpeed }); },
    saveStats: () => { saves.push({ ...state.stats }); effects.push({ type: 'SAVE', accepted: state.lastAcceptedSpeed, target: state.targetSpeed }); },
    recordTransportSample: speed => effects.push({ type: 'TRANSPORT', speed }),
    setTimeout: (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, delay, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id), requestAnimationFrame: () => {},
    shouldLookup: () => false,
    navigator: { onLine: true, geolocation: { clearWatch: () => {}, watchPosition: () => 2 } },
    completeGpsConnection: () => { sandbox.startupGpsPending = false; effects.push({ type: 'CONNECTED' }); },
    releaseWakeLock: async () => {}
  };
  for (const name of ['onError', 'applyVisibility', 'maybeMatchPublicTransport', 'validateRoadService', 'setAutomaticStatus', 'lookupSpeedLimit', 'checkPublicTransportService', 'requestWakeLock', 'audioContext', 'roadServiceFailure', 'setLaunchSteps', 'finishStartupWithoutGps', 'setMatchStage', 'maintainWakeLock', 'checkpointUsageTime', 'setLimit', 'showToast', 'updateSpeedDial', 'handleOverspeed']) sandbox[name] = () => {};
  // iOS packaging substitutes this platform boundary for browser geolocation.
  sandbox.window.__SPEEDO_NATIVE_GEOLOCATION__ = sandbox.navigator.geolocation;
  vm.createContext(sandbox);
  const speedRuntime = html.match(/<script id="frenano-speed-brain-v1">([\s\S]*?)<\/script>/);
  assert.ok(speedRuntime, 'generated app includes browser Speed Brain runtime');
  vm.runInContext(speedRuntime[1], sandbox);
  const roadRuntime = html.match(/<script id="frenano-road-brain-v1">([\s\S]*?)<\/script>/);
  assert.ok(roadRuntime, 'generated app includes browser Road Brain runtime');
  vm.runInContext(roadRuntime[1], sandbox);
  const speedInitialization = html.match(/  const speedBrain = window\.FrenanoSpeedBrain\.createSpeedBrain\([^\n]+/);
  assert.ok(speedInitialization, 'generated application creates its session Speed Brain');
  const roadInitialization = html.match(/  const roadBrain = window\.FrenanoRoadBrain\.createRoadBrain\([^\n]*\);/);
  assert.ok(roadInitialization, 'generated application creates its session Road Brain');
  const constants = [...html.matchAll(/^  const (?:DRIVER_MODE_\w+|TRANSIT_CANDIDATE_MAX_AGE_MS|TRANSIT_SPEED_RECOVERY_\w+) = .+;/gm)].map(m => m[0]);
  const functions = ['onPosition', 'distanceMetres', 'roundDiagnostic', 'hasStrongRailTransitContext', 'median', 'deriveTransitLongBaselineSpeed', 'applyDriverMode', 'logDriverUiChange', 'startGPS', 'disconnectDrive', 'animateSpeed', 'applySpeedBrainDriverTransition'];
  vm.runInContext([...constants, speedInitialization[0], roadInitialization[0], ...functions.map(name => functionSource(html, name))].join('\n'), sandbox);
  return { state, logs, effects, saves, timers, element, sandbox,
    sample(kmh, timestamp = 0, latitude = 0, accuracy = 1) {
      sandbox.onPosition({ timestamp, coords: { latitude, longitude: 0, accuracy, speed: kmh === null ? null : kmh / 3.6 } });
      return logs.at(-1);
    },
    wait(ms) {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
    }
  };
}

async function runIntegration(html) {
  // Changing mapping/order or max-speed injection to use a rejected candidate
  // must fail these assertions even if ownership token checks still pass.
  let h = harness(html);
  let d = h.sample(36.4);
  assert.equal(h.state.stats.maxSpeed, 36);
  assert.deepEqual(h.effects.map(e => e.type), ['SAVE', 'DRIVER_UI_CHANGE', 'SPEED', 'TRANSPORT']);
  assert.equal(h.effects[1].target, 36.4);
  assert.equal(h.effects[1].accepted, 36.4);
  assert.equal(d.speedDecision, 'ACCEPTED');
  assert.equal(d.displayedKmh, 36.4);
  assert.equal(h.state.displayedSpeed, 0, 'smoothing stays outside GPS callback');
  h.state.stats.maxSpeed = 0; // User can clear usage statistics during a drive.
  d = h.sample(150, 1000, .0001);
  assert.equal(d.speedDecision, 'HELD');
  assert.equal(h.state.stats.maxSpeed, 0, 'held candidate or retained accepted speed must not repopulate maximum');
  assert.equal(h.state.stats.metres, 11.119492664455873, 'distance statistics still consume the location segment');
  d = h.sample(150, 2000, .00035);
  assert.equal(d.speedDecision, 'ACCEPTED_CONFIRMED');
  assert.equal(h.state.stats.maxSpeed, 150, 'confirmed acceptance executes build hook');
  const acceptedMetres = h.state.stats.metres;
  d = h.sample(300, 3000, .0005);
  assert.equal(d.speedDecision, 'REJECTED');
  assert.equal(h.state.stats.maxSpeed, 150);
  assert.ok(h.state.stats.metres > acceptedMetres, 'distance uses retained accepted speed on rejection');
  assert.equal(d.distanceMetres, 16.7);
  assert.equal(d.movementScore, 16.68);
  assert.equal(d.decision, d.speedDecision);
  assert.equal(d.selectedSpeedKmh, d.displayedKmh);
  h.state.statisticsEnabled = false;
  h.sample(120, 4000, .0008);
  assert.equal(h.state.stats.maxSpeed, 150);
  assert.equal(h.state.lastStatsPosition, null);
  h.sandbox.animateSpeed();
  assert.equal(h.state.displayedSpeed, (120 / 3.6 * 3.6) * .14, 'original 0.14 smoothing');
  assert.equal(h.element('speed').dataset.kmh, '17');
  assert.equal(h.element('speed').textContent, 11, 'built mph presentation');

  h = harness(html);
  h.sample(10);
  h.sample(6, 1000);
  const timer = h.state.driverExitTimer;
  assert.equal(h.timers.get(timer).delay, 5000);
  h.sample(6, 2000);
  assert.equal(h.state.driverExitTimer, timer, 'repeated low samples preserve timer');
  h.wait(4999);
  assert.equal(h.state.driverModeActive, true);
  h.wait(1);
  assert.equal(h.state.driverModeActive, false, 'timeout exits without another sample');
  assert.equal(h.logs.at(-1).reason, 'BELOW_6_KMH_FOR_5_SECONDS');
  assert.equal(h.element('body').classList.contains('driver-mode'), false);
  h.sample(10, 3000); h.sample(6, 4000); h.sample(10, 5000);
  assert.equal(h.state.driverExitTimer, null);
  assert.equal(h.timers.size, 0, 'entry cancels actual timer');
  h.sample(6, 6000); h.sample(7, 7000); h.wait(5000);
  assert.equal(h.state.driverModeActive, true, 'callback reads latest accepted speed');
  h.sample(6, 8000);
  h.state.watchId = null; h.wait(5000);
  assert.equal(h.state.driverModeActive, true, 'hidden/inactive watch callback preserves driver state');
  h.sample(6, 9000);
  assert.equal(h.state.driverModeActive, false);
  assert.equal(h.logs.at(-2).reason, 'GPS_STOPPED');

  h = harness(html);
  h.sample(10); h.sample(6, 1000);
  h.state.transitSpeedRecoverySamples = [{ timestamp: 0 }];
  await h.sandbox.startGPS();
  assert.equal(h.timers.size, 0, 'startGPS clears actual timer');
  assert.equal(h.state.targetSpeed, 0);
  assert.equal(h.state.transitSpeedRecoverySamples.length, 1, 'Brain reset does not reset transport history');
  d = h.sample(10, 2000);
  assert.equal(d.derivedKmh, null, 'startGPS resets speed baseline');
  assert.equal(h.state.driverModeActive, true, 'startGPS resets logical driver state');
  h.sample(6, 3000);
  let release;
  h.sandbox.releaseWakeLock = () => new Promise(resolve => { release = resolve; });
  const disconnecting = h.sandbox.disconnectDrive();
  h.sample(36, 3500); // A callback already queued when clearWatch ran.
  release();
  await disconnecting;
  assert.equal(h.timers.size, 0, 'disconnect clears actual timer');
  assert.equal(h.state.transitSpeedRecoverySamples.length, 0);
  h.state.watchId = 1;
  d = h.sample(10, 4000);
  assert.equal(d.derivedKmh, null);
  assert.equal(h.state.driverModeActive, true, 'disconnect resets logical driver state');

  // Real external recovery buffer/context/median function, never fake recovery.
  h = harness(html);
  h.state.transitCandidate = { mode: 'train', confidence: .6, matchedAt: 1000000 };
  h.sample(null, 0, 0, 100);
  h.sample(null, 10000, .001, 100);
  d = h.sample(null, 20000, .002, 100);
  assert.equal(d.speedSource, 'TRANSIT_LONG_BASELINE');
  assert.equal(d.transitRecoveryMode, 'train');
  assert.equal(d.transitRecoveryEstimates, 2);
  assert.equal(d.displayedKmh, 40);
  assert.equal(d.derivedKmh, 40);
  assert.deepEqual(Array.from(d.reasons), ['POOR_POSITION_ACCURACY', 'TRANSIT_LONG_BASELINE_RECOVERY']);
  const buffer = JSON.stringify(h.state.transitSpeedRecoverySamples);
  h.sample(40, 30000, .003, 100);
  assert.equal(JSON.stringify(h.state.transitSpeedRecoverySamples), buffer, 'native speed skips recovery and buffer insertion/pruning');
  d = h.sample(Infinity, 40000, .004, 100);
  assert.equal(d.speedSource, 'NATIVE_GPS');
  assert.equal(d.rawKmh, null, 'nonfinite diagnostic rounding stays external');
  assert.equal(JSON.stringify(h.state.transitSpeedRecoverySamples), buffer, 'Infinity is native-present');
  h.wait(120001);
  d = h.sample(null, 50000, .005, 100);
  assert.equal(d.transitRecoveryMode, '', 'stale rail candidate does not recover');
  assert.equal(h.state.transitSpeedRecoverySamples.length, 2, 'missing-native callback prunes old buffer');
  h.state.transportGuess = { mode: 'tram', confidence: .8 };
  h.sample(null, 60000, .006, 100);
  d = h.sample(null, 70000, .007, 100);
  assert.equal(d.transitRecoveryMode, 'tram', 'strong classifier context enables actual recovery');

  h = harness(html);
  h.sandbox.onPosition({ timestamp: 0, coords: { latitude: 0, longitude: 0, speed: 10 } });
  d = h.sample(43.2, 1000, 0, null);
  assert.equal(d.speedDecision, 'ACCEPTED', 'missing accuracy remains invalid for contradiction');
  assert.equal(d.accuracyMetres, null);
  h = harness(html);
  h.sample(0);
  d = h.sample(0, 1000, .001);
  assert.equal(d.displayDecision, 'HELD_AT_ZERO');
  assert.equal(d.ignoredDerivedKmh, 400.3);
  assert.equal(d.previousAcceptedKmh, 0);
  assert.deepEqual(Array.from(d.displayReasons), ['NATIVE_SPEED_INDICATES_STATIONARY', 'DERIVED_SPEED_NOT_USED_FOR_DISPLAY']);
  assert.equal(h.state.stats.metres, 0, 'stationary accepted speed prevents distance accumulation');
  h = harness(html);
  h.sandbox.startupGpsPending = true;
  h.sample(10);
  assert.deepEqual(h.effects.map(e => e.type), ['STARTUP_GPS_FIRST_CALLBACK', 'CONNECTED', 'SAVE', 'DRIVER_UI_CHANGE', 'SPEED', 'TRANSPORT']);
  assert.ok(html.includes('const speedBrain = window.FrenanoSpeedBrain.createSpeedBrain({ profile: "frenano-app-v1" });'), 'live callback must use one named-profile Brain');
  console.log('PASS live Speed Brain adapter: statistics, diagnostics/order, timers/reset, actual rail recovery, startup, smoothing/mph');
}

module.exports = { runIntegration };
if (require.main === module) runIntegration(fs.readFileSync(process.argv[2] || 'dist/app/index.html', 'utf8')).catch(error => { console.error(error); process.exitCode = 1; });
