#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const candidatePath = process.argv[2] || path.join(__dirname, '..', 'index.template.html');
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

// Approved visibility model: three independent visual components.
requireText('Digital speed option is explicit', '>Speed (Digital)</label>');
requireText('Dial speed option is explicit', '>Speed (Dial)</label>');
requireText('Speed limit option remains explicit', '>Speed limit</label>');
forbidText('View all mode is removed', 'id="viewAll"');
forbidText('Choose elements mode is removed', 'id="viewCustom"');
forbidText('GPS visibility option is removed', 'id="showGps"');
forbidText('Legacy visibility mode state is removed', 'speedoViewMode');

// Digital and dial visibility must be independent: hiding digital speed must not
// hide the shared speedSection/dial container (the historical dial-only bug).
requireText('Digital speed has its own visibility target', 'id="speedDigital"');
requireText('Dial has its own visibility target', 'id="speedDial"');
forbidText('Digital toggle no longer hides whole speed section', '$("speedSection").classList.toggle("hidden-element"');
requireText('Digital visibility targets digital element', '$("speedDigital").classList.toggle("hidden-element", !state.showSpeedo)');
requireText('Dial visibility targets dial artwork independently', '$("speedDialArtwork").classList.toggle("hidden-element", !state.showDial)');

// Speed limit means the complete visual unit: sign plus road/status evidence.
requireText('Speed limit has a complete visibility wrapper', 'id="speedLimitSection"');
requireText('Speed limit toggle hides complete wrapper', '$("speedLimitSection").classList.toggle("hidden-element", !state.showLimit)');

if (failures.length) {
  console.error(`\nFAILED: ${failures.length} visible-elements contract failure(s)`);
  process.exit(1);
}
console.log('\nPASSED: visible-elements contract');
