#!/usr/bin/env node
'use strict';

const fs = require('fs');

const template = fs.readFileSync('index.template.html', 'utf8');
const build = fs.readFileSync('build.js', 'utf8');
const support = fs.readFileSync('support-diagnostics.js', 'utf8');
const failures = [];
const pass = message => console.log(`PASS  ${message}`);
const fail = message => { failures.push(message); console.error(`FAIL  ${message}`); };
const check = (condition, message) => condition ? pass(message) : fail(message);

console.log('\nSuper Simple Speedo production privacy gate\n');

check(/const experimentalFeatures = buildProfile\.experimentalFeatures === true/.test(build), 'build profile controls experimental features');
check(/if \(!EXPERIMENTAL_FEATURES\)/.test(build), 'stable release guard exists');
check(/includes\("transport\.opendata\.ch"\)/.test(build) && /Experimental transport API disabled in stable build/.test(build), 'stable build blocks Swiss PT network calls');
check(/experimentalMode: EXPERIMENTAL_FEATURES &&/.test(build), 'experimental mode cannot activate in stable build');
check(/transportDetectiveEnabled: EXPERIMENTAL_FEATURES &&/.test(build), 'transport detective cannot activate in stable build');
check(/journeyModeEnabled: EXPERIMENTAL_FEATURES &&/.test(build), 'journey mode cannot activate in stable build');

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

check(/Share diagnostic log/.test(support), 'explicit diagnostic sharing control exists');
check(/Nothing is uploaded automatically/i.test(support), 'diagnostic UI says nothing uploads automatically');
check(/coordinates, road names, stations, public-transport lines and destinations, API keys, and persistent identifiers/i.test(support), 'diagnostic UI states sensitive fields are excluded');
check(/navigator\.share/.test(support), 'system share sheet is used when available');

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

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} privacy failure(s)`);
process.exit(failures.length ? 1 : 0);
