"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createSpeedState, processSpeedSample } = require("../speed-engine");

const fixtureDirectory = path.join(__dirname, "test-data");
const fixtureFiles = fs.readdirSync(fixtureDirectory)
  .filter(name => name.endsWith(".json"))
  .sort();

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

console.log("Super Simple Speedo behaviour tests");
console.log(`Fixtures: ${fixtureDirectory}\n`);

for (const fixtureFile of fixtureFiles) {
  const fixturePath = path.join(fixtureDirectory, fixtureFile);
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const state = createSpeedState();
  let finalResult = null;

  try {
    fixture.samples.forEach((sample, index) => {
      finalResult = processSpeedSample(state, sample);
      if (sample.expect) checkExpectation(finalResult, sample.expect, `${fixture.name}, sample ${index + 1}`);
    });
    if (fixture.expectFinal) checkExpectation(finalResult, fixture.expectFinal, `${fixture.name}, final result`);
    console.log(`PASS  ${fixture.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${fixture.name}`);
    console.error(`      ${error.message}`);
  }
}

console.log(`\n${fixtureFiles.length - failures} passed, ${failures} failed`);
if (failures > 0) process.exitCode = 1;
