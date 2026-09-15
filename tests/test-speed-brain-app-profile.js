"use strict";
const assert = require("node:assert/strict");
const { createSpeedBrain } = require("../brains/speed-brain");
const cases = require("./test-data/app-profile/scenarios");
const frozen = require("./test-data/app-profile/frozen.json");
const { encode } = require("./test-data/app-profile/codec");

// Catches app-vs-legacy numeric, acceptance, source and timer lifecycle regressions.
// The expected values were executed from base built functions before Brain edits.
let failures = 0;
for (const [index, test] of cases.entries()) {
  try {
    assert.equal(test.name, frozen.cases[index].name);
    const brain = createSpeedBrain({ profile: "frenano-app-v1" });
    let now = 0, timeoutAt = null, watchActive = true, driverUiActive = false;
    for (const [eventIndex, event] of test.events.entries()) {
      let actual = { driverUiActive, driverTransition: { scheduleExitTimeout: false, cancelExitTimeout: false, applyReason: null } };
      if (event.type === "sample") {
        watchActive = event.sample.watchActive !== false;
        actual = brain.process(event.sample);
      } else if (event.type === "watch") watchActive = event.active;
      else if (event.type === "reset") { brain.reset(); timeoutAt = null; driverUiActive = false; actual.driverUiActive = false; }
      else if (event.type === "wait") {
        now += event.ms;
        if (timeoutAt !== null && timeoutAt <= now) { timeoutAt = null; actual = brain.driverExitTimeout({ watchActive }); }
      }
      if (actual.driverTransition?.cancelExitTimeout) timeoutAt = null;
      if (actual.driverTransition?.scheduleExitTimeout) timeoutAt = now + 5000;
      driverUiActive = actual.driverUiActive;
      const expected = frozen.cases[index].expected[eventIndex];
      const selected = Object.fromEntries(Object.keys(expected).map(key => [key, actual[key]]));
      assert.deepEqual(encode(selected), expected, `${test.name}, event ${eventIndex + 1}`);
      assert.equal(/"(?:latitude|longitude|fromLat|toLat|fromLon|toLon|lastGpsSample|pendingSpeedCandidate)"/.test(JSON.stringify(actual)), false, "normal result is coordinate-free");
    }
  } catch (error) { failures++; console.error(`FAIL app profile: ${test.name}: ${error.message}`); }
}
// Mutable options and returned effects must not change private session policy/state.
try {
  const options = { profile: "frenano-app-v1", baselineResetSeconds: 1, driverModeExitSpeed: 99 };
  const a = createSpeedBrain(options), b = createSpeedBrain({ profile: "frenano-app-v1" });
  const sample = { timestamp: 0, latitude: 0, longitude: 0, accuracy: 1, speedMps: 10 / 3.6 };
  const first = a.process(sample);
  assert.deepEqual(b.process(sample), first);
  options.profile = "legacy";
  a.process({ ...sample, timestamp: 1000, speedMps: 6 / 3.6 }).driverTransition.scheduleExitTimeout = false;
  assert.equal(a.driverExitTimeout().driverUiActive, false, "omitted event means active watch");
  assert.equal(b.driverExitTimeout({ watchActive: true }).driverUiActive, true, "unscheduled event is inert");
  assert.equal(a.process({ ...sample, timestamp: 21000, latitude: .001, speedMps: null }).speedSource, "POSITION_DERIVED");
  b.reset();
  assert.deepEqual(b.driverExitTimeout(), { driverUiActive: false, driverTransition: { scheduleExitTimeout: false, cancelExitTimeout: false, applyReason: null } });
} catch (error) { failures++; console.error(`FAIL app profile isolation: ${error.message}`); }
if (failures) { process.exitCode = 1; console.error(`${failures} app-profile groups failed`); }
else console.log(`PASS ${cases.length} frozen app-profile scenarios, ${cases.reduce((n, test) => n + test.events.length, 0)} events, isolation and privacy`);
