'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('dist/index.html', 'utf8');

function extractBetween(startMarker, endMarker, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `Could not find generated ${label}`);
  assert.ok(end > start, `Could not find end of generated ${label}`);
  return html.slice(start, end);
}

const helperToken = extractBetween('  function supportSafeToken(', '  function supportElapsedSeconds(', 'supportSafeToken');
const helperElapsed = extractBetween('  function supportElapsedSeconds(', '  function refreshViewportGeometry(', 'supportElapsedSeconds');
const formatter = extractBetween('  function sanitisedSupportDiagnosticText(', '  async function shareSupportDiagnostics(', 'sanitisedSupportDiagnosticText');

const toxic = {
  timeUtc: '2026-09-03T20:00:00.000Z',
  event: 'ROAD_LOOKUP',
  displayedKmh: 42,
  rawKmh: 41.7,
  derivedKmh: 42.1,
  accuracyMetres: 6,
  speedSource: 'NATIVE_GPS',
  speedDecision: 'ACCEPTED',
  reasons: ['GOOD_ACCURACY'],
  outcome: 'MATCHED',
  response: { httpStatus: 200 },
  latitude: 47.123456,
  longitude: 8.654321,
  lat: 47.123456,
  lon: 8.654321,
  lng: 8.654321,
  road: 'SECRET ROAD NAME',
  station: 'SECRET STATION NAME',
  line: 'SECRET LINE 99',
  destination: 'SECRET DESTINATION',
  apiKey: 'SECRET-API-KEY',
  sessionId: 'SECRET-SESSION-ID'
};

const context = {
  state: { diagnosticLog: [toxic] },
  navigator: {
    platform: 'iPhone',
    userAgent: 'Speedo Test latitude=47.999 longitude=8.999 lat=47.1 lon=8.1 lng=8.2'
  },
  SUPPORT_REPORT_MAX_EVENTS: 150
};
vm.createContext(context);
vm.runInContext(`${helperToken}\n${helperElapsed}\n${formatter}\nthis.makeReport = sanitisedSupportDiagnosticText;`, context);

const report = context.makeReport();
assert.match(report, /Super Simple Speedo support diagnostics v1/);
assert.match(report, /ROAD_LOOKUP/);
assert.match(report, /NATIVE_GPS/);
assert.match(report, /GOOD_ACCURACY/);
assert.match(report, /MATCHED/);
assert.match(report, /\t200(?:\n|$)/);

for (const secret of [
  '47.123456', '8.654321', '47.999', '8.999', '47.1', '8.1', '8.2',
  'SECRET ROAD NAME', 'SECRET STATION NAME', 'SECRET LINE 99',
  'SECRET DESTINATION', 'SECRET-API-KEY', 'SECRET-SESSION-ID'
]) {
  assert.ok(!report.includes(secret), `Support report leaked sensitive value: ${secret}`);
}

console.log('PASS  generated support report includes expected technical fields');
console.log('PASS  generated support report excludes coordinates, road/station/line/destination, API key and session ID');
