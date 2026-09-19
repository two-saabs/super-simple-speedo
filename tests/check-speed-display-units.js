#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'index.template.html'), 'utf8');
const control = '<div class="setting-title">Units</div><div class="segmented"><button class="segment-button" id="unitKmhButton" type="button">km/h</button><button class="segment-button" id="unitMphButton" type="button">mph</button></div>';
const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const nativeControls = markup.includes(control);
const runtime = html.match(/<script id="speed-display-units-script">([\s\S]*?)<\/script>/);
assert.ok(runtime, 'units runtime remains owned by the application');
function functionSource(name) {
  const start = html.indexOf(`  function ${name}(`);
  assert.ok(start >= 0, `actual application contains ${name}`);
  return html.slice(start, html.indexOf('\n  }', start) + 4);
}
function harness(preference, readyState = 'loading') {
  const elements = new Map(), listeners = new Map(), storage = new Map(), events = [];
  if (preference !== undefined) storage.set('speedUnits', preference);
  function element(tag = 'div') {
    const classes = new Set(), attributes = new Map();
    return { tag, dataset: {}, style: {}, children: [], textContent: '', className: '',
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle: (name, on) => on ? classes.add(name) : classes.delete(name) },
      addEventListener(type, fn) { this[type] = fn; },
      setAttribute: (key, value) => attributes.set(key, String(value)), getAttribute: key => attributes.get(key),
      appendChild(child) { this.children.push(child); }, replaceChildren() { this.children = []; },
      set innerHTML(value) {
        assert.equal(value, control, 'injected setting matches approved classes, labels and button types');
        this.title = 'Units';
        for (const id of ['unitKmhButton', 'unitMphButton']) elements.set(id, element('button'));
      }
    };
  }
  const $ = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const appearance = { title: 'Appearance' }, visible = { title: 'Visible elements' };
  const body = { children: [appearance, visible], querySelector: () => visible,
    insertBefore(node, before) { this.children.splice(this.children.indexOf(before), 0, node); } };
  if (nativeControls) {
    assert.ok(markup.indexOf('>Appearance</div>') < markup.indexOf(control));
    assert.ok(markup.indexOf(control) < markup.indexOf('>Visible elements</div>'));
    const setting = element(); setting.innerHTML = control; body.insertBefore(setting, visible);
  }
  const unit = element();
  const choices = [30, 50, 80, 100, 120, 130].map(limit => { const button = element('button'); button.dataset.limit = String(limit); return button; });
  const state = { displayedSpeed: 80.6, targetSpeed: 80.6, limit: null, mode: 'manual', sounds: false };
  const document = { readyState, body: element(),
    getElementById: id => elements.get(id) || null,
    querySelector: selector => selector === '.speed-dial-core .unit' ? unit : { querySelector: () => body },
    querySelectorAll: selector => { assert.equal(selector, '#limitGrid .limit-choice[data-limit]'); return choices; },
    createElement: tag => element(tag), createElementNS: (_, tag) => element(tag),
    addEventListener: (name, fn) => listeners.set(name, fn)
  };
  const context = { state, $, document, Event: class { constructor(type) { this.type = type; } },
    window: { dispatchEvent: event => events.push(event.type) },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    speedEl: $('speed'), limitEl: $('limit'), limitButton: $('limitButton'), sourceEl: $('source'), roadEl: $('road'),
    dialTrackEl: $('dialTrack'), dialAvailableEl: $('dialAvailable'), dialCurrentEl: $('dialCurrent'), dialTicksEl: $('dialTicks'),
    setRoadConfidence() {}, updateChoiceState() {}, playLimitChime() {}, handleOverspeed() {},
    setTimeout() {}, requestAnimationFrame(fn) { context.nextFrame = fn; }
  };
  vm.createContext(context);
  const constants = ['DIAL_START_DEG', 'DIAL_SWEEP_DEG'].map(name => html.match(new RegExp(`  const ${name} = [^;]+;`))[0]);
  vm.runInContext([...constants, 'let lastDialScale = null;', ...['polarPoint','dialArcPath','dialMaximum','rebuildDialTicks','updateSpeedDial','animateSpeed','displayRoadName','setLimit'].map(functionSource)].join('\n'), context);
  context.setLimit(120, 'Manual limit', ''); context.animateSpeed();
  vm.runInContext(runtime[1], context);
  if (readyState === 'loading') listeners.get('DOMContentLoaded')();
  assert.deepEqual(body.children.map(node => node.title), ['Appearance', 'Units', 'Visible elements']);
  function labels() { return $('dialTicks').children.filter(node => node.tag === 'text').map(node => node.textContent); }
  return { context, state, $, unit, choices, storage, events, labels,
    click(id) { $(id).click(); }, frame() { context.nextFrame(); } };
}
const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);
for (const preference of [undefined, 'kmh', 'mph', 'invalid']) {
  for (const ready of ['loading', 'complete']) {
    const h = harness(preference, ready), mph = preference === 'mph';
    assert.equal(h.unit.textContent, mph ? 'mph' : 'km/h');
    assert.equal(h.$('unitMphButton').classList.contains('active'), mph);
    assert.equal(h.$('unitKmhButton').classList.contains('active'), !mph);
    assert.equal(h.$('speed').dataset.kmh, '81');
    assert.equal(String(h.$('speed').textContent), mph ? '50' : '81');
    assert.equal(h.$('limit').dataset.kmh, '120');
    assert.equal(String(h.$('limit').textContent), mph ? '75' : '120');
    assert.equal(h.state.displayedSpeed, 80.6); assert.equal(h.state.limit, 120);
  }
}
const h = harness('kmh');
for (const [speed, maximum] of [[0,160],[160,160],[160.1,180],[200,200],[241,240],[300,240]]) approx(h.context.dialMaximum(speed), maximum);
assert.deepEqual(h.labels(), Array.from({length:17}, (_,i) => String(i*10)));
// Geometry stays in canonical km/h; labels/ticks convert only for presentation.
const kmh80 = h.$('dialTicks').children.filter(node => node.tag === 'text')[8];
approx(Number(kmh80.getAttribute('x')), 160); approx(Number(kmh80.getAttribute('y')), -1);
h.click('unitMphButton');
assert.equal(h.storage.get('speedUnits'), 'mph');
assert.equal(h.unit.textContent, 'mph');
assert.equal(h.$('speed').textContent, '50'); assert.equal(h.$('limit').textContent, '75');
assert.deepEqual(h.choices.map(node => node.textContent), ['19','31','50','62','75','81']);
assert.deepEqual(h.choices.map(node => node.dataset.limit), ['30','50','80','100','120','130']);
assert.equal(h.events.at(-1), 'resize');
h.frame();
assert.deepEqual(h.labels(), Array.from({length:11}, (_,i) => String(i*10)));
for (const [speed, maximum] of [[0,160.9344],[160.9344,160.9344],[161,193.12128],[200,225.30816],[300,241.4016]]) approx(h.context.dialMaximum(speed), maximum);
const mph50 = h.$('dialTicks').children.filter(node => node.tag === 'text')[5];
approx(Number(mph50.getAttribute('x')), 160); approx(Number(mph50.getAttribute('y')), -1);
assert.equal(h.state.displayedSpeed,80.6); assert.equal(h.state.limit,120);
h.context.setLimit(null, 'Automatic limit', '');
assert.equal(h.$('limit').textContent, '?'); assert.equal(h.$('limit').dataset.kmh, '');
h.click('unitKmhButton'); h.frame();
assert.equal(h.$('limit').textContent, '?'); assert.equal(h.$('speed').textContent, '81');
assert.equal(h.storage.get('speedUnits'), 'kmh');
assert.deepEqual(h.choices.map(node => node.textContent), ['30','50','80','100','120','130']);
assert.deepEqual(h.labels(), Array.from({length:17}, (_,i) => String(i*10)));
h.state.displayedSpeed = h.state.targetSpeed = 300;
h.frame(); assert.equal(h.labels().at(-1), '240');
h.click('unitMphButton'); h.frame(); assert.equal(h.labels().at(-1), '150');
console.log('PASS Speed Display Units: control/order, persisted preference, canonical values/datasets, rounding, dial geometry/ticks, unit switching and manual choices');
