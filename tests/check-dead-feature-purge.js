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
  'Transport Detective',
  'transport.opendata.ch',
  'launchStepTransit',
  'transitCandidate',
  'transitEvidence',
  'transitSpeedRecoverySamples',
  'deriveTransitLongBaselineSpeed',
  'hasStrongRailTransitContext',
  'classifyTransport',
  'observeJourney',
  'liveIntelligence',
  'hypothesisRace',
  'groundTruth',
  'data-ground-truth',
  'GROUND_TRUTH',
  'TRANSIT_QUERY',
  'TRANSIT_MATCH',
  'TRANSPORT_GUESS',
  'experimental-choice-card',
  'experimental-transport-setting'
];

const runtimeSources = [template, ...['build.js', 'service-worker.js', '_headers'].map(file => fs.readFileSync(path.join(root, file), 'utf8')),
  ...fs.readdirSync(path.join(root, 'build')).filter(file => file.endsWith('.js'))
    .map(file => fs.readFileSync(path.join(root, 'build', file), 'utf8'))].join('\n');

for (const marker of forbiddenTransportJourneyMarkers) {
  assert.ok(!runtimeSources.includes(marker), `removed Transport/Journey marker must stay absent: ${marker}`);
}

console.log('Dead-feature purge contract passed: Transport/Journey is absent.');
