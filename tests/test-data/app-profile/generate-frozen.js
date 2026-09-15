"use strict";
// Maintainer-only generator: execute actual pre-extraction BUILT functions, never Brain.
// Usage: node tests/test-data/app-profile/generate-frozen.js <85ff675 built app/index.html>
// Rebuild source: git archive 85ff675 into scratch; GEOAPIFY_API_KEY=placeholder node build.js.
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const cases = require("./scenarios");
const { encode } = require("./codec");
const html = fs.readFileSync(process.argv[2], "utf8");
function fn(name) {
  const start = html.indexOf(`  function ${name}(`);
  if (start < 0) throw Error(`Missing frozen function ${name}`);
  return html.slice(start, html.indexOf("\n  }", start) + 4);
}
const originalPosition = fn("onPosition");
const speedBody = originalPosition.slice(originalPosition.indexOf("    const sampleTime = position.timestamp;"), originalPosition.indexOf("    if (state.statisticsEnabled) {", originalPosition.indexOf("    // Keep speed validation")));
const driver = fn("updateDriverMode");
if (!driver.includes("trustedSpeed <= DRIVER_MODE_EXIT_SPEED") || !driver.includes("state.lastAcceptedSpeed <= DRIVER_MODE_EXIT_SPEED")) throw Error("Expected BUILT <=6 driver behavior");
const source = `${fn("distanceMetres")}\n${driver}\nfunction process(position) { const c = position.coords;\n${speedBody}\n}`;
const extractedHash = crypto.createHash("sha256").update(source).digest("hex");
if (extractedHash !== "cc318f9b4ba5a0d618bb97a482896d6e91823e7c498a36d138a8d0570b78a856") throw Error("Source differs from frozen 85ff675 built functions");
const keys = ["rawKmh", "derivedKmh", "ignoredDerivedKmh", "displayedKmh", "accuracyMetres", "elapsedSeconds", "distanceMetres", "movementScore", "speedSource", "displayDecision", "displayReasons", "previousAcceptedKmh", "speedDecision", "reasons", "driverUiActive"];
const snapshots = cases.map(test => {
  let now = 0, id = 0, diagnostic, transition;
  const timers = new Map();
  const state = {};
  function reset() { for (const key of Object.keys(state)) delete state[key]; Object.assign(state, { lastGpsSample: null, lastAcceptedSpeed: 0, lastSpeedTimestamp: null, pendingSpeedCandidate: null, targetSpeed: 0, driverModeActive: false, driverExitTimer: null, watchId: 1 }); timers.clear(); }
  const context = vm.createContext({ state, DRIVER_MODE_ENTER_SPEED: 10, DRIVER_MODE_EXIT_SPEED: 6, DRIVER_MODE_EXIT_DELAY_MS: 5000, GPS_BASELINE_RESET_SECONDS: 30,
    roundDiagnostic: value => value, addDiagnostic: value => { diagnostic = value; },
    deriveTransitLongBaselineSpeed: () => context.recovery == null ? null : { kmh: context.recovery },
    setTimeout: (callback, delay) => { transition.scheduleExitTimeout = true; timers.set(++id, { callback, at: now + delay }); return id; },
    clearTimeout: timer => { transition.cancelExitTimeout = true; timers.delete(timer); },
    applyDriverMode: (active, reason) => { state.driverModeActive = active; transition.applyReason = reason; }
  });
  vm.runInContext(source, context); reset();
  const expected = test.events.map(event => {
    transition = { scheduleExitTimeout: false, cancelExitTimeout: false, applyReason: null };
    if (event.type === "sample") {
      const sample = event.sample;
      state.watchId = sample.watchActive === false ? null : 1;
      context.recovery = sample.transitRecoveryKmh;
      context.process({ timestamp: sample.timestamp, coords: { ...sample, speed: sample.speedMps } });
      const result = Object.fromEntries(keys.map(key => [key, diagnostic[key]]));
      result.accuracyMetres = Number.isFinite(sample.accuracy) ? sample.accuracy : null;
      return { ...result, acceptedKmh: state.lastAcceptedSpeed, driverTransition: transition };
    }
    if (event.type === "watch") state.watchId = event.active ? 1 : null;
    if (event.type === "reset") reset();
    if (event.type === "wait") { now += event.ms; for (const [timer, item] of timers) if (item.at <= now) { timers.delete(timer); item.callback(); } }
    return { driverUiActive: state.driverModeActive, driverTransition: transition };
  });
  return { name: test.name, expected };
});
const output = { provenance: { sourceCommit: "85ff675839a259a463c30a063a34da00d3089f10", source: "built dist/app/index.html", extractedFunctionsSha256: extractedHash, note: "Actual built speed block + driver + distance executed with fake external timers; roundDiagnostic identity captures exact unrounded math. Accuracy output normalized finite-or-null; transit evidence supplied externally. No Brain imported." }, cases: snapshots };
fs.writeFileSync(`${__dirname}/frozen.json`, JSON.stringify(encode(output), null, 2) + "\n");
console.log(`Frozen ${snapshots.length} built-app scenarios (${snapshots.reduce((n, c) => n + c.expected.length, 0)} events)`);
