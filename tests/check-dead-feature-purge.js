'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'index.template.html'), 'utf8');

// Transport Detective / Super Simple Journey were removed from the product.
// Keep this contract narrow: support diagnostics, Road Brain and Speed Brain
// remain live product capabilities and are intentionally outside this purge.
const forbiddenTransportJourneyMarkers = [
  'transportDetectiveEnabled',
  'journeyModeEnabled',
  'transportSamples',
  'transportStops',
  'transportGuess',
  'transportLookup',
  'recordTransportSample',
  'resetJourneySession',
  'Super Simple Journey',
  'Transport Detective'
];

for (const marker of forbiddenTransportJourneyMarkers) {
  assert.ok(!template.includes(marker), `removed Transport/Journey marker must stay absent: ${marker}`);
}

console.log('Dead-feature purge contract passed: Transport/Journey is absent.');
