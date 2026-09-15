"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { SPEED_BRAIN_VERSION, createSpeedBrain } = require("../brains/speed-brain");
const { createSpeedState, processSpeedSample } = require("../speed-engine");

assert.equal(SPEED_BRAIN_VERSION, "1.0.0");
const brain = createSpeedBrain();
assert.equal(brain.version, "1.0.0");
assert.equal(Object.isFrozen(brain), true);
assert.equal(typeof brain.process, "function");
assert.equal(typeof brain.reset, "function");
const first = brain.process({ latitude:47.3769, longitude:8.5417, timestamp:1000, accuracy:8, speedMps:0 });
assert.equal(first.brainVersion, "1.0.0");
brain.reset();
const afterReset = brain.process({ latitude:47.3769, longitude:8.5417, timestamp:1000, accuracy:8, speedMps:0 });
assert.deepEqual(afterReset, first);

const fixtureDirectory = path.join(__dirname, "test-data");
const fixtureFiles = fs.readdirSync(fixtureDirectory)
  .filter(name => name.endsWith(".json"))
  .sort();

assert.equal(fixtureFiles.length, 8, "expected eight golden speed fixtures");

let failures = 0;

function approximately(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, received ${actual}`);
}

function checkExpectation(actual, expected, context) {
  for (const [key, value] of Object.entries(expected)) {
    if (key.endsWith("Includes")) {
      const actualKey = key.slice(0, -"Includes".length);
      assert.ok(Array.isArray(actual[actualKey]), `${context}: ${actualKey} is not an array`);
      for (const expectedItem of value) {
        assert.ok(actual[actualKey].includes(expectedItem),
          `${context}: expected ${actualKey} to include ${expectedItem}; got ${JSON.stringify(actual[actualKey])}`);
      }
    } else if (key.endsWith("Approx")) {
      const actualKey = key.slice(0, -"Approx".length);
      approximately(actual[actualKey], value.value, value.tolerance, `${context}: ${actualKey}`);
    } else {
      assert.deepEqual(actual[key], value,
        `${context}: expected ${key}=${JSON.stringify(value)}, received ${JSON.stringify(actual[key])}`);
    }
  }
}

function checkBrainExpectation(actual, expected, context) {
  assert.equal(actual.brainVersion, "1.0.0", `${context}: expected canonical Brain version`);
  if (Object.hasOwn(expected, "brainVersion")) {
    checkExpectation(actual, expected, context);
    return;
  }

  const { brainVersion: _brainVersion, ...legacyResult } = actual;
  checkExpectation(legacyResult, expected, context);
}

function replayFixture(fixtureFile, interfaceName, createProcessor, expectationChecker) {
  const fixturePath = path.join(fixtureDirectory, fixtureFile);
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const process = createProcessor();
  let finalResult = null;

  try {
    fixture.samples.forEach((sample, index) => {
      finalResult = process(sample);
      if (sample.expect) {
        expectationChecker(finalResult, sample.expect,
          `${fixture.name}, ${interfaceName}, sample ${index + 1}`);
      }
    });
    if (fixture.expectFinal) {
      expectationChecker(finalResult, fixture.expectFinal, `${fixture.name}, ${interfaceName}, final result`);
    }
    console.log(`PASS  ${fixture.name} (${interfaceName})`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${fixture.name} (${interfaceName})`);
    console.error(`      ${error.message}`);
  }
}

console.log("Super Simple Speedo behaviour tests");
console.log(`Fixtures: ${fixtureDirectory}\n`);

for (const fixtureFile of fixtureFiles) {
  replayFixture(fixtureFile, "compatibility", () => {
    const state = createSpeedState();
    return sample => processSpeedSample(state, sample);
  }, checkExpectation);

  replayFixture(fixtureFile, "canonical", () => {
    const fixtureBrain = createSpeedBrain();
    return sample => fixtureBrain.process(sample);
  }, checkBrainExpectation);
}

const replayCount = fixtureFiles.length * 2;
console.log(`\n${replayCount - failures} passed, ${failures} failed`);
if (failures > 0) process.exitCode = 1;

require("./test-speed-brain-app-profile");
