#!/usr/bin/env node
'use strict';

const fs = require('fs');

const candidatePath = process.argv[2] || 'dist/app/index.html';
if (!fs.existsSync(candidatePath)) {
  console.error(`FAIL  settings UI candidate not found: ${candidatePath}`);
  process.exit(2);
}

const html = fs.readFileSync(candidatePath, 'utf8');
const failures = [];

function requireText(name, text) {
  if (html.includes(text)) console.log(`PASS  ${name}`);
  else { failures.push(name); console.error(`FAIL  ${name}`); }
}

function forbidText(name, text) {
  if (!html.includes(text)) console.log(`PASS  ${name}`);
  else { failures.push(name); console.error(`FAIL  ${name}`); }
}

// Golden Settings contract for the currently approved Frenano UI.
// Intentional product-copy/UI changes should update this file consciously.
requireText('Settings owner contains final card presentation', 'id="settings-polish-v2"');
requireText('Settings redesign remains the single Settings owner', 'id="settings-redesign-v2"');
requireText('Help and privacy section title is final', '>Help & privacy<');
requireText('Feedback heading is canonical at source', '<div class="setting-title" style="font-size:19px;">Feedback?</div>');
requireText('Feedback invitation is canonical at source', 'Questions, ideas or suggestions are always welcome — <a href="mailto:support@frenano.app"');
requireText('Support email is visibly literal', '>support@frenano.app</a>');
requireText('Support email remains a mail link', 'href="mailto:support@frenano.app"');
requireText('Diagnostic action remains available', 'id="shareSupportDiagnostics"');
requireText('Diagnostic privacy reassurance remains', "diagnostics.textContent='Nothing is uploaded automatically.'");
requireText('Privacy policy remains linked', 'https://frenano.app/privacy.html');
requireText('Location setting remains installed', "setting.id='locationPermissionSetting'");
requireText('Location title remains visible', '>Location</div>');
requireText('Native location action remains Manage', "native?'Manage':'How to change'");
requireText('Native denied location action remains Open Settings', "permissionStatus==='denied'?'Open Settings':'Manage'");
requireText('Units setting remains available', '>Units</div>');
requireText('km/h unit choice remains available', 'id="unitKmhButton"');
requireText('mph unit choice remains available', 'id="unitMphButton"');
requireText('Appearance and Display heading remains final', "title.textContent='Appearance & Display'");
requireText('Settings footer remains Frenano Swiss identity', 'Frenano · Made in Switzerland');
requireText('Native version footer remains App Store plus build version', "'Version 1.0 · Build '+APP_VERSION");
forbidText('Obsolete Need help copy is absent', '>Need help?<');
forbidText('Obsolete Email us action is absent', '>Email us</a>');

// Behavioural golden contract for focused non-Settings owners.
requireText('Statistics state keeps max speed', 'maxSpeed: 0, roadsIdentified: 0');
requireText('Statistics records a new maximum speed', 'candidateKmh > (state.stats.maxSpeed || 0)');
requireText('Statistics records newly identified roads', 'state.stats.roadsIdentified = (state.stats.roadsIdentified || 0) + 1');
requireText('Statistics reset clears extended counters', 'apiResponseBytes: 0, maxSpeed: 0, roadsIdentified: 0 }');
requireText('Speed display preserves canonical km/h value', 'speedEl.dataset.kmh = String(shown)');
requireText('Speed display converts canonical speed to mph', 'Math.round(shown * 0.621371)');
requireText('Limit display preserves canonical km/h value', 'limitEl.dataset.kmh = nextLimit === null ? "" : String(nextLimit)');
requireText('Limit display converts canonical limit to mph', 'Math.round(nextLimit * 0.621371)');
requireText('Dial maximum retains mph conversion geometry', 'const base = mphMode ? 160.9344 : 160');
requireText('Dial ticks retain mph conversion geometry', 'const tickStep = mphMode ? 16.09344 : 10');

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} settings UI contract failure(s)`);
process.exit(failures.length ? 1 : 0);
