'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { applyRoadBrainOwnership } = require('../build/road-brain-ownership');

const root = path.join(__dirname, '..');
const buildSource = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
const iosSource = fs.readFileSync(path.join(root, 'build-ios.js'), 'utf8');
const runtimeSource = fs.readFileSync(path.join(root, 'build', 'road-brain-runtime.js'), 'utf8');
const templateSource = fs.readFileSync(path.join(root, 'index.template.html'), 'utf8');
const appSource = applyRoadBrainOwnership(templateSource);
const brainSource = fs.readFileSync(path.join(root, 'brains', 'road-brain.js'), 'utf8');

assert.ok(buildSource.includes('ROAD_BRAIN_VERSION'), 'web builder imports Road Brain version');
assert.ok(buildSource.includes('brains/road-brain.js'), 'web builder reads Road Brain source');
assert.ok(buildSource.includes('injectRoadBrainRuntime'), 'web builder injects Road Brain runtime');
assert.ok(buildSource.includes('applyRoadBrainOwnership'), 'web builder applies Road Brain ownership handover');
assert.ok(runtimeSource.includes('frenano-road-brain-v1'), 'runtime has stable script id');
assert.ok(runtimeSource.includes('window.FrenanoRoadBrain'), 'runtime exposes browser global');
assert.ok(runtimeSource.includes('createRoadBrain: api.createRoadBrain'), 'runtime exposes createRoadBrain');
assert.ok(runtimeSource.includes('sanitiseRoadName: api.sanitiseRoadName'), 'runtime exposes sanitiser');
assert.ok(runtimeSource.includes('version: api.ROAD_BRAIN_VERSION'), 'runtime exposes version');

// Ownership contract is asserted on the generated application source because
// Frenano already uses deterministic build transforms for release wiring.
assert.ok(appSource.includes('const roadBrain = window.FrenanoRoadBrain.createRoadBrain'), 'app creates one Road Brain instance');
assert.ok(appSource.includes('roadBrain.process({'), 'road lookup delegates evidence to Road Brain');
assert.ok(!appSource.includes('function candidateConfirmation('), 'legacy inline road confirmation function is removed from generated app');
assert.ok(!appSource.includes('state.autoCandidates.push('), 'generated app no longer owns road candidate history');
assert.ok(!appSource.includes('state.autoMatchCandidates.push('), 'generated app no longer owns road match candidate history');
assert.ok(!appSource.includes('state.acceptedAutoLimit = roadDecision.accepted.limit'), 'generated app does not copy accepted limit out of Road Brain');
assert.ok(!appSource.includes('state.acceptedAutoRoad = displayRoadName(roadDecision.accepted.road)'), 'generated app does not copy accepted road out of Road Brain');
assert.ok(appSource.includes('roadBrain.getState().accepted'), 'generated app reads accepted road state from Road Brain');
assert.ok(brainSource.includes('candidateLimits'), 'Road Brain owns limit candidate history');
assert.ok(brainSource.includes('candidateRoads'), 'Road Brain owns road-name candidate history');
assert.ok(!brainSource.includes('Geoapify'), 'Road Brain remains provider-agnostic');
assert.ok(!brainSource.includes('road_class'), 'Road Brain accepts normalized evidence, not provider field names');

assert.ok(/path\.join\(distDir,\s*["']app["'],\s*["']index\.html["']\)/.test(iosSource), 'iOS packages shared web build');
assert.ok(!iosSource.includes('brains/road-brain.js'), 'iOS builder does not duplicate Road Brain source');

console.log('Road Brain runtime and ownership integration tests passed.');