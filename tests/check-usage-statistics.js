#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRoadBrain } = require('../brains/road-brain');
const candidate = process.argv[2] || path.join(__dirname, '..', 'index.template.html');
const html = fs.readFileSync(candidate, 'utf8');
function functionSource(name) {
  const start = html.search(new RegExp(`^  (?:async )?function ${name}\\(`, 'm'));
  assert.ok(start >= 0, `application contains ${name}`);
  return html.slice(start, html.indexOf('\n  }', start) + 4);
}
const defaults = html.match(/stats: loadJsonObject\("speedoStats", (\{[^\n]+\})\),/);
assert.ok(defaults, 'local statistics retain their existing persistence key');
const expected = { trips: 0, milliseconds: 0, metres: 0, apiBytes: 0, apiRequests: 0, apiResponses: 0, apiResponseBytes: 0, maxSpeed: 0, roadsIdentified: 0 };
const plain = value => JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(vm.runInNewContext(`(${defaults[1]})`)), expected);

async function run() {
  const elements = new Map(), storage = new Map(), writes = [], handlers = new Map(), events = [];
  const $ = id => {
    if (!elements.has(id)) elements.set(id, { textContent: '', classList: { contains: () => false },
      addEventListener: (type, callback) => handlers.set(`${id}:${type}`, callback) });
    return elements.get(id);
  };
  const state = { stats: { ...expected }, statisticsEnabled: true, driveStartedAt: null,
    watchId: 1, points: [], lastStatsPosition: null, roadServiceStatus: 'ready', mode: 'manual', apiKey: 'fixture-key', targetSpeed: 30 };
  let speedResult = {}, roadName = 'Badenerstrasse', limit = 50, accuracy = 10;
  const roadBrain = createRoadBrain();
  const context = { state, $, roadBrain, speedBrain: { process: () => speedResult },
    startupGpsPending: false, statusEl: { textContent: '' }, TextEncoder,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); writes.push(key); } },
    performance: { now: () => 0 }, navigator: { onLine: true },
    addDiagnostic: entry => { assert.notEqual(entry.roadDecision?.state, 'ERROR', entry.roadDecision?.reason); events.push(entry); },
    applySpeedBrainDriverTransition() {}, shouldLookup: () => false,
    setAutomaticStatus() {}, setLimit() {}, showToast() {}, beginNetworkMeasurement() {}, measureNetworkResponse() {},
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ features: [{ properties: {
      legs: [{ steps: [{ speed_limit: limit, name: roadName, road_class: 'primary' }] }],
      waypoints: [{ original_index: state.points.length - 1, leg_index: 0, step_index: 0, match_type: 'matched' }]
    } }] }) })
  };
  vm.createContext(context);
  vm.runInContext(['loadJsonObject', 'saveStats', 'byteLength', 'formatBytes', 'formatStat', 'updateStatsDisplay', 'distanceMetres', 'roundDiagnostic', 'displayRoadName', 'onPosition', 'lookupSpeedLimit'].map(functionSource).join('\n'), context);
  // Loading old statistics does not merge new defaults into valid stored objects.
  assert.deepEqual(plain(context.loadJsonObject('speedoStats', expected)), expected);
  storage.set('speedoStats', '{"trips":4,"metres":25}');
  assert.deepEqual(plain(context.loadJsonObject('speedoStats', expected)), { trips: 4, metres: 25 });
  storage.set('speedoStats', 'invalid');
  assert.deepEqual(plain(context.loadJsonObject('speedoStats', expected)), expected);
  for (const [metres, shown] of [[-1, '0 m'], [0, '0 m'], [12.6, '13 m'], [999, '999 m'], [999.6, '1000 m'], [1000, `${context.formatStat(1, 1)} km`], [1250, `${context.formatStat(1.25, 1)} km`]]) {
    state.stats.metres = metres; context.updateStatsDisplay();
    assert.equal($('statDistance').textContent, shown);
  }
  state.stats.maxSpeed = 83; state.stats.roadsIdentified = 7;
  context.updateStatsDisplay();
  assert.equal($('statMaxSpeed').textContent, context.formatStat(83));
  assert.equal($('statRoadsIdentified').textContent, context.formatStat(7));
  delete state.stats.maxSpeed; delete state.stats.roadsIdentified;
  context.updateStatsDisplay();
  assert.equal($('statMaxSpeed').textContent, '0');
  assert.equal($('statRoadsIdentified').textContent, '0');

  function speed(decision, acceptedKmh, enabled, maximum) {
    state.statisticsEnabled = enabled; state.stats.maxSpeed = maximum; state.lastStatsPosition = null;
    speedResult = { speedDecision: decision, acceptedKmh, displayedKmh: acceptedKmh, rawKmh: 250 };
    const count = writes.length;
    context.onPosition({ timestamp: 0, coords: { latitude: 47, longitude: 8, accuracy: 10, speed: 0 } });
    return writes.length - count;
  }
  for (const decision of ['ACCEPTED', 'ACCEPTED_CONFIRMED']) {
    assert.equal(speed(decision, 83.6, true, 80), 1);
    assert.equal(state.stats.maxSpeed, 84, 'accepted speed is rounded for storage, not raw GPS speed');
    assert.equal(JSON.parse(storage.get('speedoStats')).maxSpeed, 84);
    assert.equal(speed(decision, 80, true, 80), 0);
    assert.equal(speed(decision, 79, true, 80), 0);
    assert.equal(speed(decision, 100, false, 80), 0);
    assert.equal(state.stats.maxSpeed, 80);
  }
  for (const decision of ['HELD', 'REJECTED', 'NO_SPEED']) {
    assert.equal(speed(decision, 100, true, 20), 0);
    assert.equal(state.stats.maxSpeed, 20);
  }
  // Preserve comparison against the stored rounded maximum, including fractional repeats.
  assert.equal(speed('ACCEPTED', 80.4, true, 80), 1);
  assert.equal(state.stats.maxSpeed, 80);

  state.statisticsEnabled = true; state.targetSpeed = 30; state.stats.roadsIdentified = 0;
  async function road(name = roadName, newLimit = limit) {
    roadName = name; limit = newLimit;
    await context.lookupSpeedLimit({ latitude: 47, longitude: 8, accuracy });
    return events.at(-1).roadDecision.outcome;
  }
  assert.equal(await road(), 'BEST_ESTIMATE');
  assert.equal(state.stats.roadsIdentified, 0);
  assert.equal(await road(), 'CONFIRMED');
  assert.equal(state.stats.roadsIdentified, 1);
  await road(); assert.equal(state.stats.roadsIdentified, 1, 'repeated confirmation is not a new road');
  await road(roadName, 60); await road();
  assert.equal(state.stats.roadsIdentified, 1, 'limit-only change does not count a road');
  accuracy = 100; await road('Other Road');
  assert.equal(state.stats.roadsIdentified, 1, 'unconfirmed evidence does not count');
  accuracy = 10; await road('Other Road'); await road();
  assert.equal(state.stats.roadsIdentified, 2);
  assert.equal(JSON.parse(storage.get('speedoStats')).roadsIdentified, 2);
  state.statisticsEnabled = false; await road('Third Road'); await road();
  assert.equal(state.stats.roadsIdentified, 2);
  state.statisticsEnabled = true; await road();
  assert.equal(state.stats.roadsIdentified, 2, 'reenabling does not retrospectively count an already confirmed road');
  await road('Badenerstrasse'); await road();
  assert.equal(state.stats.roadsIdentified, 3, 'counter tracks confirmed road changes, not all-time unique names');

  const resetStart = html.indexOf('  $("resetStats").addEventListener("click", () => {');
  assert.ok(resetStart >= 0);
  vm.runInContext(html.slice(resetStart, html.indexOf('\n  });', resetStart) + 6), context);
  handlers.get('resetStats:click')();
  assert.deepEqual(plain(state.stats), expected);
  assert.deepEqual(JSON.parse(storage.get('speedoStats')), expected);
  assert.equal(state.lastStatsPosition, null);
  assert.deepEqual(plain(state.sessionNetwork), { bytes: 0, requests: 0, responses: 0, responseBytes: 0 });
  assert.equal(state.driveSessionActive, true);
  assert.equal(typeof state.driveStartedAt, 'number');
  assert.ok(writes.every(key => key === 'speedoStats'), 'statistics persist only under the existing local key');
  if (html.includes('id="frenano-speed-brain-v1"')) {
    for (const id of ['statMaxSpeed', 'statRoadsIdentified']) assert.ok(html.includes(`id="${id}"`), `built Settings contains ${id}`);
  }
  console.log('PASS Usage Statistics: defaults/load/reset, distance units, rendering, accepted maxima, confirmed road changes, local persistence');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
