#!/usr/bin/env node
'use strict';

const fs = require('fs');

const template = fs.readFileSync('index.template.html', 'utf8');
const build = fs.readFileSync('build.js', 'utf8');
const failures = [];
const pass = message => console.log(`PASS  ${message}`);
const fail = message => { failures.push(message); console.error(`FAIL  ${message}`); };
const check = (condition, message) => condition ? pass(message) : fail(message);

console.log('\nSuper Simple Speedo production privacy gate\n');

// Stable-build isolation: experimental Swiss public-transport features may remain
// in the shared source, but must be disabled and network-blocked in production.
check(/const experimentalFeatures = buildProfile\.experimentalFeatures === true/.test(build), 'build profile controls experimental features');
check(/if \(!EXPERIMENTAL_FEATURES\)/.test(build), 'stable release guard exists');
check(/includes\("transport\.opendata\.ch"\)/.test(build) && /Experimental transport API disabled in stable build/.test(build), 'stable build blocks Swiss PT network calls');
check(/experimentalMode: EXPERIMENTAL_FEATURES &&/.test(build), 'experimental mode cannot activate in stable build');
check(/transportDetectiveEnabled: EXPERIMENTAL_FEATURES &&/.test(build), 'transport detective cannot activate in stable build');
check(/journeyModeEnabled: EXPERIMENTAL_FEATURES &&/.test(build), 'journey mode cannot activate in stable build');

// Privacy promises / absence of common tracking SDKs.
check(/no\s+account/i.test(template), 'no-account promise remains present');
check(/no\s+ads/i.test(template), 'no-ads promise remains present');
const trackers = [
  ['Google Analytics', /googletagmanager|google-analytics|\bgtag\s*\(/i],
  ['Meta/Facebook Pixel', /connect\.facebook\.net|fbq\s*\(/i],
  ['Segment', /cdn\.segment\.com|analytics\.load\s*\(/i],
  ['Sentry', /browser\.sentry-cdn\.com|Sentry\.init\s*\(/i],
  ['Mixpanel', /cdn\.mxpnl\.com|mixpanel\.init\s*\(/i]
];
for (const [name, pattern] of trackers) check(!pattern.test(template), `no ${name} integration detected`);

// Diagnostic sharing must remain explicit and privacy-reduced.
check(/Share diagnostic log/.test(template), 'explicit diagnostic sharing control exists');
check(/Nothing is uploaded automatically/i.test(template), 'diagnostic UI says nothing uploads automatically');
check(/coordinates, road names, stations, public-transport lines and destinations, API keys, and persistent identifiers/i.test(template), 'diagnostic UI states sensitive fields are excluded');

// The shareable log must not serialize transport location/destination identifiers.
// Internal diagnostic storage may contain richer data for development; the user-
// initiated share path is the privacy boundary audited here.
const compactMatch = template.match(/function compactDiagnosticText\([\s\S]*?\n  }\n\n  function liveIntelligenceLine/);
check(Boolean(compactMatch), 'shareable compact diagnostic formatter found');
if (compactMatch) {
  const compact = compactMatch[0];
  check(!/station=/.test(compact), 'shareable diagnostics exclude station names');
  check(!/\bto=/.test(compact), 'shareable diagnostics exclude destinations');
  check(!/\bline=/.test(compact), 'shareable diagnostics exclude public-transport line identifiers');
  check(!/road=/.test(compact), 'shareable diagnostics exclude road names');
  check(!/latitude|longitude|\blat=|\blon=|\blng=/i.test(compact), 'shareable diagnostics exclude coordinates');
  check(!/__GEOAPIFY_API_KEY__|apiKey/i.test(compact), 'shareable diagnostics exclude API keys');
  check(!/sessionId/.test(compact), 'shareable diagnostics exclude persistent/session identifiers');
}

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} privacy failure(s)`);
process.exit(failures.length ? 1 : 0);
