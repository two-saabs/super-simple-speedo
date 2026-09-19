#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRoadBrain } = require('../brains/road-brain');
const approved = require('./test-data/road-card/approved.json');
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'index.template.html'), 'utf8');

// Frozen from shipped web output before migration; no build transform is used here.
const styles = [...html.matchAll(/<style id="road-card-refresh-v4">([\s\S]*?)<\/style>/g)];
assert.equal(styles.length, 1, 'one native card style block');
assert.equal(styles[0][1], approved.css, 'exact approved sizing, themes, interaction and responsive CSS');
assert.ok(html.includes(approved.markup), 'complete card retains sign, road/status evidence and visibility wrapper');
assert.ok(!html.includes('<button id="limitButton"'), 'sign stays non-interactive');
assert.ok(html.includes('$("speedLimitSection").classList.toggle("hidden-element", !state.showLimit)'), 'visibility hides entire card');

function functionSource(name) {
  const start = html.indexOf(`  function ${name}(`);
  assert.ok(start >= 0, `actual application contains ${name}`);
  return html.slice(start, html.indexOf('\n  }', start) + 4);
}
function element() {
  const classes = new Set();
  return { textContent: '', className: '', dataset: {}, classList: {
    toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    contains: name => classes.has(name)
  } };
}
const elements = new Map();
const $ = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
const position = { latitude: 47, longitude: 8 };
const roadBrain = createRoadBrain();
const state = { mode: 'auto', limit: null, displayedSpeed: 0, sounds: false, lastStatsPosition: position };
const context = { $, state, roadBrain, document: { body: element() },
  sourceEl: $('source'), roadEl: $('road'), gpsEl: $('gps'), roadConfidenceEl: $('roadConfidence'),
  limitEl: $('limit'), limitButton: $('limitButton'), localStorage: { getItem: () => 'kmh' },
  updateChoiceState() {}, playLimitChime() {}
};
vm.createContext(context);
vm.runInContext(['setMatchStage', 'setRoadConfidence', 'setAutomaticStatus', 'displayRoadName', 'setLimit'].map(functionSource).join('\n'), context);
function expectCard(source, road, confidence, kind) {
  assert.equal($('source').textContent, source);
  assert.equal($('road').textContent, road);
  assert.equal($('roadConfidence').textContent, confidence);
  assert.equal($('roadConfidence').className, kind);
}
context.setLimit(null, 'Automatic limit', '');
assert.equal($('limit').textContent, '?');
assert.equal($('limitButton').classList.contains('unknown'), true);
context.setAutomaticStatus('waiting');
expectCard('Automatic limit', 'Finding your location…', '', '');
context.setAutomaticStatus('error');
expectCard('Automatic limit unavailable', 'Lookup unavailable', '', '');
const observation = { limit: 50, roadName: 'Badenerstrasse, 123', roadClass: 'primary', matchType: 'matched', accuracyMetres: 10, speedKmh: 30, position };
assert.equal(roadBrain.process(observation).outcome, 'BEST_ESTIMATE');
context.setAutomaticStatus('confirming', observation.roadName);
expectCard('From:', 'Badenerstrasse', 'Best estimate', 'estimate');
const result = roadBrain.process(observation);
assert.equal(result.outcome, 'CONFIRMED');
context.setLimit(result.accepted.limit, 'Automatic limit from:', result.accepted.road);
context.setAutomaticStatus('matched');
assert.equal(String($('limit').textContent), '50');
assert.equal($('limitButton').classList.contains('unknown'), false);
expectCard('From:', 'Badenerstrasse', 'Confirmed', 'confirmed');
state.lastStatsPosition = { latitude: 47.001, longitude: 8 };
assert.equal(roadBrain.freshnessForPosition(state.lastStatsPosition).fresh, false);
for (const stage of ['matched', 'matching', 'error']) {
  context.setAutomaticStatus(stage);
  expectCard('From:', 'Badenerstrasse', 'Last confirmed', 'confirmed');
  assert.equal(String($('limit').textContent), '50', 'stale/error presentation retains accepted limit');
}
state.lastStatsPosition = position;
context.setAutomaticStatus('matching');
expectCard('From:', 'Badenerstrasse', 'Confirmed', 'confirmed');
state.mode = 'manual';
context.setLimit(80, 'Manual limit', 'Tap the sign to change');
expectCard('Manual limit', 'Tap the sign to change', '', '');
assert.equal($('source').classList.contains('manual-source'), true);
assert.equal(roadBrain.getState().accepted.limit, 50, 'display updates do not mutate Brain evidence');
console.log('PASS Road Card: approved markup/CSS, visibility, unknown/manual, estimate, fresh/stale accepted and lookup-error display');
