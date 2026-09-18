'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const buildSource = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
const iosSource = fs.readFileSync(path.join(root, 'build-ios.js'), 'utf8');
const runtimeSource = fs.readFileSync(path.join(root, 'build', 'road-brain-runtime.js'), 'utf8');
const templateSource = fs.readFileSync(path.join(root, 'index.template.html'), 'utf8');
const appSource = templateSource;
const brainSource = fs.readFileSync(path.join(root, 'brains', 'road-brain.js'), 'utf8');

assert.ok(buildSource.includes('ROAD_BRAIN_VERSION'), 'web builder imports Road Brain version');
assert.ok(buildSource.includes('brains/road-brain.js'), 'web builder reads Road Brain source');
assert.ok(buildSource.includes('injectRoadBrainRuntime'), 'web builder injects Road Brain runtime');
assert.ok(!buildSource.includes('road-brain-ownership'), 'web builder has no Road Brain ownership transform dependency');
assert.ok(!buildSource.includes('applyRoadBrainOwnership'), 'web builder does not apply a Road Brain ownership handover');
assert.ok(!fs.existsSync(path.join(root, 'build', 'road-brain-ownership.js')), 'legacy Road Brain ownership transform file is removed');
assert.ok(runtimeSource.includes('frenano-road-brain-v1'), 'runtime has stable script id');
assert.ok(runtimeSource.includes('window.FrenanoRoadBrain'), 'runtime exposes browser global');
assert.ok(runtimeSource.includes('createRoadBrain: api.createRoadBrain'), 'runtime exposes createRoadBrain');
assert.ok(runtimeSource.includes('sanitiseRoadName: api.sanitiseRoadName'), 'runtime exposes sanitiser');
assert.ok(runtimeSource.includes('version: api.ROAD_BRAIN_VERSION'), 'runtime exposes version');

// The source template itself is the ownership boundary. Builds may inject runtime
// packaging, but must not perform a road-decision brain transplant.
assert.ok(templateSource.includes('const roadBrain = window.FrenanoRoadBrain.createRoadBrain'), 'template creates one Road Brain instance natively');
assert.ok(templateSource.includes('roadBrain.process({'), 'template road lookup delegates evidence to Road Brain natively');
assert.ok(!templateSource.includes('function candidateConfirmation('), 'template contains no legacy inline road confirmation function');
assert.ok(!templateSource.includes('state.autoCandidates.push('), 'template no longer owns road candidate history');
assert.ok(!templateSource.includes('state.autoMatchCandidates.push('), 'template no longer owns road match candidate history');
assert.ok(!templateSource.includes('state.acceptedAutoLimit = roadDecision.accepted.limit'), 'template does not copy accepted limit out of Road Brain');
assert.ok(!templateSource.includes('state.acceptedAutoRoad = displayRoadName(roadDecision.accepted.road)'), 'template does not copy accepted road out of Road Brain');
assert.ok(templateSource.includes('roadBrain.getState().accepted'), 'template reads accepted road state from Road Brain');

// Generated application preserves that native ownership unchanged.
assert.ok(appSource.includes('const roadBrain = window.FrenanoRoadBrain.createRoadBrain'), 'app creates one Road Brain instance');
assert.ok(appSource.includes('roadBrain.process({'), 'road lookup delegates evidence to Road Brain');
assert.ok(!appSource.includes('function candidateConfirmation('), 'legacy inline road confirmation function is absent from generated app');
assert.ok(brainSource.includes('candidateLimits'), 'Road Brain owns limit candidate history');
assert.ok(brainSource.includes('candidateRoads'), 'Road Brain owns road-name candidate history');
assert.ok(!brainSource.includes('Geoapify'), 'Road Brain remains provider-agnostic');
assert.ok(!brainSource.includes('road_class'), 'Road Brain accepts normalized evidence, not provider field names');

const automaticStatusStart = appSource.indexOf('  function setAutomaticStatus(stage, message = "") {');
const automaticStatusEnd = appSource.indexOf('\n  function displayRoadName(', automaticStatusStart);
assert.ok(automaticStatusStart >= 0 && automaticStatusEnd > automaticStatusStart, 'generated app retains automatic road-status adapter');
const automaticStatusSource = appSource.slice(automaticStatusStart, automaticStatusEnd);
assert.ok(automaticStatusSource.includes('roadBrain.freshnessForPosition('), 'automatic road UI asks Road Brain whether retained accepted evidence is spatially fresh');
assert.ok(automaticStatusSource.includes('"Last confirmed"'), 'automatic road UI distinguishes stale retained evidence from current confirmation');
assert.ok(!automaticStatusSource.includes('const hasLastConfirmed = Boolean(accepted);'), 'automatic road UI does not equate any historical accepted road with current confirmation');

const transportSampleStart = appSource.indexOf('  function recordTransportSample(speedKmh) {');
const transportSampleEnd = appSource.indexOf('\n  function applyExperimentalSettings()', transportSampleStart);
assert.ok(transportSampleStart >= 0 && transportSampleEnd > transportSampleStart, 'generated app retains Transport sample adapter');
const transportSampleSource = appSource.slice(transportSampleStart, transportSampleEnd);
assert.ok(transportSampleSource.includes('roadBrain.getState().accepted'), 'Transport reads canonical accepted road evidence from Road Brain');
assert.ok(transportSampleSource.includes('roadBrain.freshnessForPosition('), 'Transport requires accepted road evidence to be spatially fresh for the current position');
assert.ok(!transportSampleSource.includes('roadConfirmed: Boolean(roadBrain.getState().accepted)'), 'Transport does not treat any historical accepted road as currently confirmed');
assert.ok(!transportSampleSource.includes('state.acceptedAutoRoad'), 'Transport does not infer road confirmation from copied app state');

assert.ok(/path\.join\(distDir,\s*["']app["'],\s*["']index\.html["']\)/.test(iosSource), 'iOS packages shared web build');
assert.ok(!iosSource.includes('brains/road-brain.js'), 'iOS builder does not duplicate Road Brain source');

console.log('Road Brain runtime and ownership integration tests passed.');