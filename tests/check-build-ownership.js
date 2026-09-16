#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');

const settingsPath = 'build/settings-redesign.js';
const polishPath = 'build/settings-polish.js';
const helpPath = 'build/help-contact-privacy-fix.js';
const statisticsPath = 'build/usage-statistics.js';
const speedDisplayPath = 'build/speed-display-units.js';
const brainPath = 'brains/speed-brain.js';
const runtimePath = 'build/speed-brain-runtime.js';
const failures = [];

function pass(message) { console.log(`PASS  ${message}`); }
function fail(message) { failures.push(message); console.error(`FAIL  ${message}`); }
function requireCondition(name, condition) { condition ? pass(name) : fail(name); }

const settings = fs.readFileSync(settingsPath, 'utf8');
const polish = fs.existsSync(polishPath) ? fs.readFileSync(polishPath, 'utf8') : '';
const help = fs.existsSync(helpPath) ? fs.readFileSync(helpPath, 'utf8') : '';
requireCondition('Speed Brain has one canonical algorithm owner', fs.existsSync(brainPath));
requireCondition('Speed Brain browser runtime has a focused build owner', fs.existsSync(runtimePath));
const template = fs.readFileSync('index.template.html', 'utf8');
const canonicalBrain = fs.readFileSync(brainPath, 'utf8');
const speedCallback = template.slice(template.indexOf('  function onPosition('), template.indexOf('  function completeGpsConnection('));
for (const token of ['MOVEMENT_CONTRADICTION', 'AWAITING_CONFIRMATION', 'START_FROM_STATIONARY_UNCONFIRMED']) {
  requireCondition(`template no longer owns ${token}`, !template.includes(token));
  requireCondition(`Brain owns ${token}`, canonicalBrain.includes(token));
}
requireCondition('speed callback delegates distance math to Brain', !speedCallback.slice(0, speedCallback.indexOf('    if (state.statisticsEnabled)')).includes('distanceMetres('));
requireCondition('Brain owns speed distance radius', canonicalBrain.includes('6371000'));
requireCondition('template retains shared Road/Transport distance helper', template.includes('const R = 6371000;'));
requireCondition('application creates exactly one named-profile Brain',
  (template.match(/window\.FrenanoSpeedBrain\.createSpeedBrain/g) || []).length === 1 &&
  template.includes('createSpeedBrain({ profile: "frenano-app-v1" })'));
requireCondition('obsolete speed filtering state and driver decision function removed',
  !/pendingSpeedCandidate|lastGpsSample|lastSpeedTimestamp|function updateDriverMode/.test(template));
const compatibilityEngine = fs.readFileSync('speed-engine.js', 'utf8');
requireCondition('legacy speed-engine is only a facade', compatibilityEngine.includes('require("./brains/speed-brain")'));
requireCondition('usage statistics has a focused build owner', fs.existsSync(statisticsPath));
const statistics = fs.readFileSync(statisticsPath, 'utf8');
requireCondition('usage statistics does not depend on copied Road Brain accepted state',
  !statistics.includes('state.acceptedAutoRoad = displayRoadName(roadDecision.accepted.road)'));
requireCondition('usage statistics observes confirmed Road Brain decisions',
  statistics.includes('roadOutcome === "CONFIRMED"') && statistics.includes('previousConfirmedRoad !== acceptedRoad'));
requireCondition('Settings redesign does not own statistics state', !settings.includes('maxSpeed: 0, roadsIdentified: 0'));
requireCondition('Settings redesign does not record maximum speed', !settings.includes('candidateKmh > (state.stats.maxSpeed || 0)'));
requireCondition('Settings redesign does not count identified roads', !settings.includes('state.stats.roadsIdentified = (state.stats.roadsIdentified || 0) + 1'));

requireCondition('speed display units has a focused build owner', fs.existsSync(speedDisplayPath));
requireCondition('Settings redesign does not convert displayed speed', !settings.includes('shown * 0.621371'));
requireCondition('Settings redesign does not convert displayed speed limits', !settings.includes('nextLimit * 0.621371'));
requireCondition('Settings redesign does not own dial maximum conversion', !settings.includes('const base = mphMode ? 160.9344 : 160'));
requireCondition('Settings redesign does not own dial tick conversion', !settings.includes('const tickStep = mphMode ? 16.09344 : 10'));
requireCondition('Settings redesign does not own speed unit preference', !settings.includes("const unitKey = 'speedUnits'"));
requireCondition('Settings redesign does not install unit controls', !settings.includes('function installUnitsSetting'));
const speedDisplay = fs.readFileSync(speedDisplayPath, 'utf8');
requireCondition('Speed display owner owns speed unit preference', speedDisplay.includes("const unitKey = 'speedUnits'"));
requireCondition('Speed display owner installs unit controls', speedDisplay.includes('function installUnitsSetting'));

for (const algorithmSymbol of ['processSpeedSample', 'haversineMetres', 'MOVEMENT_CONTRADICTION', 'AWAITING_CONFIRMATION']) {
  requireCondition(`Settings redesign does not own ${algorithmSymbol}`, !settings.includes(algorithmSymbol));
  requireCondition(`Speed display units does not own ${algorithmSymbol}`, !speedDisplay.includes(algorithmSymbol));
}

if (fs.existsSync(runtimePath)) {
  const { injectSpeedBrainRuntime } = require(`../${runtimePath}`);
  const brainSource = fs.readFileSync(brainPath, 'utf8');
  const guardedApplicationHtml = `<!doctype html>
<html><body>
<script>
(() => {
  const EXPERIMENTAL_FEATURES = false;
  window.releaseGuardPreserved = EXPERIMENTAL_FEATURES === false;
  const brain = window.FrenanoSpeedBrain.createSpeedBrain({ profile: "frenano-app-v1" });
  window.applicationDecision = brain.process({
    latitude: 47,
    longitude: 8,
    timestamp: 1000,
    accuracy: 5,
    speedMps: 5,
    watchActive: false
  });
})();
</script>
</body></html>`;
  const transformed = injectSpeedBrainRuntime(guardedApplicationHtml, brainSource);
  const inlineScripts = [...transformed.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]))
    .map(match => ({ attributes: match[1], source: match[2] }));

  requireCondition('Speed Brain runtime is a standalone script before the application script',
    inlineScripts.length === 2 && /\bid=["']frenano-speed-brain-v1["']/.test(inlineScripts[0].attributes));

  let parseError = null;
  try {
    inlineScripts.forEach((script, index) => new vm.Script(script.source, { filename: `inline-${index + 1}.js` }));
  } catch (error) {
    parseError = error;
  }
  requireCondition('every generated inline script parses as standalone JavaScript', parseError === null);

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  let executionError = null;
  try {
    inlineScripts.forEach((script, index) => {
      new vm.Script(script.source, { filename: `inline-${index + 1}.js` }).runInContext(sandbox);
    });
  } catch (error) {
    executionError = error;
  }
  requireCondition('Speed Brain runtime executes before the guarded application IIFE', executionError === null);

  const browserApi = sandbox.window.FrenanoSpeedBrain;
  requireCondition('browser facade exposes only version and createSpeedBrain',
    browserApi && Object.keys(browserApi).sort().join(',') === 'createSpeedBrain,version');
  requireCondition('browser facade is frozen', browserApi && Object.isFrozen(browserApi));
  requireCondition('browser facade exposes Speed Brain version 1.0.0', browserApi?.version === '1.0.0');
  requireCondition('browser facade creates a legacy processor',
    typeof browserApi?.createSpeedBrain?.()?.process === 'function');
  requireCondition('browser facade includes the Frenano application profile',
    sandbox.window.applicationDecision?.brainVersion === '1.0.0' &&
    sandbox.window.applicationDecision?.acceptedKmh === 18);
  requireCondition('release guard survives Speed Brain injection', sandbox.window.releaseGuardPreserved === true);

  let missingMarkerRejected = false;
  let missingScriptRejected = false;
  try { injectSpeedBrainRuntime('<html><body></body></html>', brainSource); } catch (_) { missingMarkerRejected = true; }
  try { injectSpeedBrainRuntime('<html><body>(() => {</body></html>', brainSource); } catch (_) { missingScriptRejected = true; }
  requireCondition('runtime injection fails closed without an application IIFE', missingMarkerRejected);
  requireCondition('runtime injection fails closed without an enclosing application script', missingScriptRejected);
}

// Task 4 target: all Settings presentation, location controls, help/privacy
// presentation and footer have one owner. Focused non-Settings behavior remains
// outside this transform.
requireCondition('Settings redesign owns final location controls', settings.includes('function installLocationSetting'));
requireCondition('Settings redesign owns final Settings footer', settings.includes("footer.className = 'settings-footer'"));
requireCondition('Settings redesign owns final diagnostic help copy', settings.includes('Share a privacy-safe diagnostic log to help us understand what happened.'));
requireCondition('Settings redesign owns Help & privacy presentation', settings.includes('Help & privacy'));
requireCondition('Settings redesign owns feedback presentation', settings.includes('Questions, ideas or suggestions are always welcome'));
requireCondition('Settings redesign owns privacy-policy presentation', settings.includes('Read privacy policy'));
requireCondition('Historical Settings polish transform is retired', !fs.existsSync(polishPath));
requireCondition('Historical help/privacy Settings transform is retired', !fs.existsSync(helpPath));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} build ownership failure(s)`);
process.exit(failures.length ? 1 : 0);
