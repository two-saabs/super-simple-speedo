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
requireText('Settings polish owns final card presentation', 'id="settings-polish-v2"');
requireText('Settings redesign remains present during staged cleanup', 'id="settings-redesign-v2"');
requireText('Help and privacy section title is final', '>Help & privacy<');
requireText('Feedback heading is canonical at source', '<div class="setting-title" style="font-size:19px;">Feedback?</div>');
requireText('Feedback invitation is canonical at source', 'Questions, ideas or suggestions are always welcome — <a href="mailto:support@frenano.app"');
requireText('Support email is visibly literal', '>support@frenano.app</a>');
requireText('Support email remains a mail link', 'href="mailto:support@frenano.app"');
requireText('Diagnostic action remains available', 'id="shareSupportDiagnostics"');
requireText('Diagnostic privacy reassurance remains', "diagnostics.textContent = 'Nothing is uploaded automatically.'");
requireText('Privacy policy remains linked', 'https://frenano.app/privacy.html');
requireText('Location setting remains installed', "setting.id = 'locationPermissionSetting'");
requireText('Location title remains visible', '>Location</div>');
requireText('Native location action remains Manage', "native ? 'Manage' : 'How to change'");
requireText('Native denied location action remains Open Settings', "permissionStatus === 'denied' ? 'Open Settings' : 'Manage'");
requireText('Units setting remains available', '>Units</div>');
requireText('km/h unit choice remains available', 'id="unitKmhButton"');
requireText('mph unit choice remains available', 'id="unitMphButton"');
requireText('Appearance and Display heading remains final', "title.textContent='Appearance & Display'");
requireText('Settings footer remains Frenano Swiss identity', "Frenano · Made in Switzerland");
requireText('Native version footer remains App Store plus build version', "'Version 1.0 · Build ' + APP_VERSION");
forbidText('Obsolete Need help copy is absent', '>Need help?<');
forbidText('Obsolete Email us action is absent', '>Email us</a>');

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} settings UI contract failure(s)`);
process.exit(failures.length ? 1 : 0);
