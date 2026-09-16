'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const buildSource = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
const iosSource = fs.readFileSync(path.join(root, 'build-ios.js'), 'utf8');
const runtimeSource = fs.readFileSync(path.join(root, 'build', 'road-brain-runtime.js'), 'utf8');

assert.ok(buildSource.includes('ROAD_BRAIN_VERSION'), 'web builder imports Road Brain version');
assert.ok(buildSource.includes('brains/road-brain.js'), 'web builder reads Road Brain source');
assert.ok(buildSource.includes('injectRoadBrainRuntime'), 'web builder injects Road Brain runtime');
assert.ok(runtimeSource.includes('frenano-road-brain-v1'), 'runtime has stable script id');
assert.ok(runtimeSource.includes('window.FrenanoRoadBrain'), 'runtime exposes browser global');
assert.ok(runtimeSource.includes('createRoadBrain: api.createRoadBrain'), 'runtime exposes createRoadBrain');
assert.ok(runtimeSource.includes('sanitiseRoadName: api.sanitiseRoadName'), 'runtime exposes sanitiser');
assert.ok(runtimeSource.includes('version: api.ROAD_BRAIN_VERSION'), 'runtime exposes version');

// iOS is deliberately built from the already-generated shared web app, so the
// same injected Road Brain must survive native packaging rather than be copied
// or reimplemented in build-ios.js.
assert.ok(iosSource.includes('dist", "app", "index.html'), 'iOS packages shared web build');
assert.ok(!iosSource.includes('brains/road-brain.js'), 'iOS builder does not duplicate Road Brain source');

console.log('Road Brain runtime integration tests passed.');
