#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { injectSupportDiagnostics } = require('../build/support-diagnostics');
const { SPEED_BRAIN_VERSION } = require('../brains/speed-brain');
const root = path.join(__dirname, '..');
const readRoot = file => fs.readFileSync(path.join(root, file), 'utf8');

const template = readRoot('index.template.html');
const build = readRoot('build.js');
const support = readRoot('build/support-diagnostics.js');
const failures = [];
const pass = message => console.log(`PASS  ${message}`);
const fail = message => { failures.push(message); console.error(`FAIL  ${message}`); };
const check = (condition, message) => condition ? pass(message) : fail(message);

console.log('\nSuper Simple Speedo production privacy gate\n');

check(/const experimentalFeatures = buildProfile\.experimentalFeatures === true/.test(build), 'build profile controls experimental features');
check(/if \(!EXPERIMENTAL_FEATURES\)/.test(build), 'stable release guard exists');
check(/experimentalMode: EXPERIMENTAL_FEATURES &&/.test(build), 'experimental mode cannot activate in stable build');

check(/no\s+account/i.test(template), 'no-account promise remains present');
check(/no\s+ads/i.test(template), 'no-ads promise remains present');
const combined = `${template}\n${support}`;
const trackers = [
  ['Google Analytics', /googletagmanager|google-analytics|\bgtag\s*\(/i],
  ['Meta/Facebook Pixel', /connect\.facebook\.net|fbq\s*\(/i],
  ['Segment', /cdn\.segment\.com|analytics\.load\s*\(/i],
  ['Sentry', /browser\.sentry-cdn\.com|Sentry\.init\s*\(/i],
  ['Mixpanel', /cdn\.mxpnl\.com|mixpanel\.init\s*\(/i]
];
for (const [name, pattern] of trackers) check(!pattern.test(combined), `no ${name} integration detected`);

check(/id="shareSupportDiagnostics"/.test(template), 'explicit diagnostic sharing control exists');
check(/Nothing is uploaded automatically/i.test(template), 'diagnostic UI says nothing uploads automatically');
check(/navigator\.share/.test(support), 'system share sheet is used when available');

const injectedDiagnostics = injectSupportDiagnostics(template, {
  appVersion: '13.4.1',
  buildChannel: 'test',
  experimentalFeatures: true,
  speedBrainVersion: SPEED_BRAIN_VERSION
});
const formatterSource = injectedDiagnostics.match(
  /  const SUPPORT_REPORT_MAX_EVENTS = 150;[\s\S]*?(?=\n  async function shareSupportDiagnostics)/
);
const sensitiveSentinels = {
  latitude: 'PRIVATE_LATITUDE_47_123',
  longitude: 'PRIVATE_LONGITUDE_8_456',
  road: 'PRIVATE_ROAD_BIRCHERWEG',
  station: 'PRIVATE_STATION_CENTRAL',
  line: 'PRIVATE_LINE_S42',
  destination: 'PRIVATE_DESTINATION_HOME',
  apiKey: 'PRIVATE_API_KEY_SECRET',
  persistentId: 'PRIVATE_PERSISTENT_DEVICE_ID'
};
let renderedReport = '';
if (formatterSource) {
  const sandbox = {
    state: {
      diagnosticLog: [{
        timeUtc: '2026-09-15T12:00:00.000Z',
        event: 'SPEED',
        displayedKmh: 42,
        latitude: sensitiveSentinels.latitude,
        longitude: sensitiveSentinels.longitude,
        roadName: sensitiveSentinels.road,
        stationName: sensitiveSentinels.station,
        lineName: sensitiveSentinels.line,
        destination: sensitiveSentinels.destination,
        apiKey: sensitiveSentinels.apiKey,
        persistentId: sensitiveSentinels.persistentId
      }]
    },
    navigator: {
      platform: 'test-platform',
      userAgent: `privacy-test lat=${sensitiveSentinels.latitude} lon=${sensitiveSentinels.longitude}`
    },
    window: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${formatterSource[0]}\nglobalThis.renderedReport = sanitisedSupportDiagnosticText();`, sandbox);
  renderedReport = sandbox.renderedReport;
}
const canonicalVersionWiring =
  /const \{ SPEED_BRAIN_VERSION \} = require\("\.\/brains\/speed-brain"\);/.test(build) &&
  /speedBrainVersion:\s*SPEED_BRAIN_VERSION/.test(build) &&
  /"# speed_engine=\$\{speedBrainVersion\}"/.test(support) &&
  !/["']1\.0\.0["']/.test(build) &&
  !/["']1\.0\.0["']/.test(support);
check(
  canonicalVersionWiring && renderedReport.includes('# app_version=13.4.1\n# speed_engine=1.0.0\n'),
  'sanitised output includes the canonical Speed Brain header immediately after app version'
);
check(!/\b(?:latitude|longitude|lat=|lon=)/i.test(renderedReport), 'sanitised output excludes coordinate field names');
for (const [label, sentinel] of Object.entries(sensitiveSentinels)) {
  check(!renderedReport.includes(sentinel), `sanitised output excludes sentinel ${label}`);
}

const reportMatch = support.match(/function sanitisedSupportDiagnosticText\(\)[\s\S]*?\n  }\n\n  async function shareSupportDiagnostics/);
check(Boolean(reportMatch), 'sanitised support diagnostic formatter found');
if (reportMatch) {
  const report = reportMatch[0];
  check(!/station=/.test(report), 'shareable diagnostics exclude station names');
  check(!/\bto=/.test(report), 'shareable diagnostics exclude destinations');
  check(!/\bline=/.test(report), 'shareable diagnostics exclude public-transport line identifiers');
  check(!/road=/.test(report), 'shareable diagnostics exclude road names');
  check(!/item\.latitude|item\.longitude|item\.lat|item\.lon|item\.lng/.test(report), 'shareable diagnostics do not serialize coordinates');
  check(!/__GEOAPIFY_API_KEY__|item\.apiKey|state\.apiKey/.test(report), 'shareable diagnostics exclude API keys');
  check(!/item\.sessionId|DIAGNOSTIC_SESSION_ID/.test(report), 'shareable diagnostics exclude session identifiers');
}

check(/DIAGNOSTIC_MAX_ENTRIES = 300/.test(support), 'stable recent diagnostic window is capped at 300 events');
check(/DIAGNOSTIC_ARCHIVE_DAYS = 1/.test(support), 'stable diagnostic archive retention is one day');

check(!/transport\.opendata\.ch/.test(template + build), 'no transport endpoint remains in runtime or build');

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} privacy failure(s)`);
process.exit(failures.length ? 1 : 0);
