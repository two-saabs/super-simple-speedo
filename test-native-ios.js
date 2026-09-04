'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let source = fs.readFileSync('native-ios.js', 'utf8');
source = source
  .replace("import { Geolocation } from '@capacitor/geolocation';", 'const Geolocation = __mocks.Geolocation;')
  .replace("import { AppLauncher } from '@capacitor/app-launcher';", 'const AppLauncher = __mocks.AppLauncher;')
  .replace("import { StatusBar, Style } from '@capacitor/status-bar';", 'const StatusBar = __mocks.StatusBar; const Style = __mocks.Style;');
source += '\nthis.__test = { permissionLabel, normaliseError, currentPermission, ensureLocationPermission };';

const listeners = new Map();
const elements = new Map([
  ['nativeLocationPermissionStatus', { textContent: '' }],
  ['manageLocationPermission', { addEventListener() {} }],
  ['settingsButton', { addEventListener() {} }]
]);

const calls = {
  check: 0,
  request: 0,
  watch: 0,
  clear: [],
  open: []
};
let permission = 'granted';
let watchCallback = null;

const mocks = {
  Geolocation: {
    async checkPermissions() {
      calls.check += 1;
      return { location: permission };
    },
    async requestPermissions() {
      calls.request += 1;
      permission = 'granted';
      return { location: permission };
    },
    async watchPosition(options, callback) {
      calls.watch += 1;
      watchCallback = callback;
      return 'native-watch-1';
    },
    async clearWatch({ id }) {
      calls.clear.push(id);
    }
  },
  AppLauncher: {
    async openUrl({ url }) {
      calls.open.push(url);
    }
  },
  StatusBar: {
    async show() {},
    async setOverlaysWebView() {},
    async setStyle() {},
    async getInfo() { return {}; }
  },
  Style: { Dark: 'DARK' }
};

const context = {
  __mocks: mocks,
  console,
  setTimeout,
  clearTimeout,
  window: {
    innerWidth: 390,
    innerHeight: 844,
    visualViewport: null,
    addEventListener(type, handler) { listeners.set(`window:${type}`, handler); },
    location: { href: '' }
  },
  screen: { orientation: null },
  document: {
    visibilityState: 'visible',
    documentElement: { clientWidth: 390, clientHeight: 844 },
    querySelector() { return null; },
    getElementById(id) { return elements.get(id) || null; },
    addEventListener(type, handler) { listeners.set(`document:${type}`, handler); }
  }
};
vm.createContext(context);
vm.runInContext(source, context);

(async () => {
  const api = context.__test;

  assert.equal(api.permissionLabel('granted'), 'While Using App');
  assert.equal(api.permissionLabel('denied'), 'Denied');
  assert.equal(api.permissionLabel('prompt'), 'Not yet requested');
  assert.equal(api.permissionLabel('prompt-with-rationale'), 'Not yet requested');
  assert.equal(api.permissionLabel('other'), 'Unknown');

  assert.equal(api.normaliseError(new Error('permission denied')).code, 1);
  assert.equal(api.normaliseError(new Error('request timeout')).code, 3);
  assert.equal(api.normaliseError(new Error('position unavailable')).code, 2);

  permission = 'prompt';
  const resolved = await api.ensureLocationPermission();
  assert.equal(resolved, 'granted');
  assert.equal(calls.request, 1, 'prompt state should request location permission once');
  assert.equal(elements.get('nativeLocationPermissionStatus').textContent, 'While Using App');

  permission = 'granted';
  let received = null;
  let receivedError = null;
  const localId = context.window.__SPEEDO_NATIVE_GEOLOCATION__.watchPosition(
    position => { received = position; },
    error => { receivedError = error; },
    { enableHighAccuracy: true, timeout: 5000 }
  );
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.watch, 1);
  assert.equal(receivedError, null);
  watchCallback({ coords: { speed: 12.3 } }, null);
  assert.equal(received.coords.speed, 12.3);
  context.window.__SPEEDO_NATIVE_GEOLOCATION__.clearWatch(localId);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls.clear, ['native-watch-1']);

  permission = 'denied';
  let deniedError = null;
  context.window.__SPEEDO_NATIVE_GEOLOCATION__.watchPosition(
    () => assert.fail('denied permission must not produce a position'),
    error => { deniedError = error; }
  );
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(deniedError.code, 1);
  assert.equal(calls.watch, 1, 'native watch must not start while permission is denied');

  await context.window.__SPEEDO_NATIVE_PERMISSIONS__.openSettings();
  assert.deepEqual(calls.open, ['app-settings:']);

  console.log('PASS  native iOS permission labels and error mapping');
  console.log('PASS  prompt permission is requested and reflected in Settings UI');
  console.log('PASS  native geolocation watch starts, delivers positions and clears cleanly');
  console.log('PASS  denied permission blocks native watch');
  console.log('PASS  Manage in iPhone Settings opens app settings');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
