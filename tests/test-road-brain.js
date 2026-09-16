'use strict';

const assert = require('assert');
const {
  ROAD_BRAIN_VERSION,
  createRoadBrain,
  sanitiseRoadName
} = require('../brains/road-brain');

assert.strictEqual(ROAD_BRAIN_VERSION, '1.0.0');

// Road-name sanitisation preserves useful names and removes provider/technical noise.
assert.strictEqual(sanitiseRoadName('service_other'), '');
assert.strictEqual(sanitiseRoadName('service other'), '');
assert.strictEqual(sanitiseRoadName('residential'), '');
assert.strictEqual(sanitiseRoadName('Badenerstrasse, 123'), 'Badenerstrasse');
assert.strictEqual(sanitiseRoadName('A3W, Sihlhochstrasse'), 'A3W, Sihlhochstrasse');
assert.strictEqual(sanitiseRoadName('Rue_du_Lac'), 'Rue du Lac');

function observation(overrides = {}) {
  return {
    limit: 50,
    roadName: 'Badenerstrasse',
    roadClass: 'primary',
    matchType: 'matched',
    accuracyMetres: 10,
    speedKmh: 30,
    position: { latitude: 47, longitude: 8 },
    ...overrides
  };
}

// Moving requires two identical recent candidates.
{
  const brain = createRoadBrain();
  assert.strictEqual(brain.process(observation()).outcome, 'BEST_ESTIMATE');
  const confirmed = brain.process(observation());
  assert.strictEqual(confirmed.outcome, 'CONFIRMED');
  assert.strictEqual(confirmed.roadEvidenceConfirmed, true);
  assert.deepStrictEqual(confirmed.accepted, {
    limit: 50,
    road: 'Badenerstrasse',
    position: { latitude: 47, longitude: 8 }
  });
}

// Stationary requires three identical recent candidates.
{
  const brain = createRoadBrain();
  const stopped = observation({ speedKmh: 0 });
  assert.strictEqual(brain.process(stopped).outcome, 'BEST_ESTIMATE');
  assert.strictEqual(brain.process(stopped).outcome, 'BEST_ESTIMATE');
  assert.strictEqual(brain.process(stopped).outcome, 'CONFIRMED');
}

// Poor accuracy, service_other and unmatched observations cannot confirm.
for (const bad of [
  { accuracyMetres: 31 },
  { roadClass: 'service_other' },
  { matchType: 'unmatched' }
]) {
  const brain = createRoadBrain();
  const result = brain.process(observation(bad));
  assert.strictEqual(result.outcome, 'BEST_ESTIMATE');
  assert.strictEqual(result.roadEvidenceConfirmed, false);
}

// Implausible residential 80 is rejected as evidence.
{
  const brain = createRoadBrain();
  const result = brain.process(observation({ limit: 80, roadClass: 'residential' }));
  assert.strictEqual(result.outcome, 'BEST_ESTIMATE');
  assert.strictEqual(result.confidenceChecks.implausibleRoadLimit, true);
}

// Once accepted, the same road+limit can reconfirm immediately.
{
  const brain = createRoadBrain();
  brain.process(observation());
  brain.process(observation());
  const result = brain.process(observation({ accuracyMetres: 20 }));
  assert.strictEqual(result.outcome, 'CONFIRMED');
}

// Invalid unnamed evidence retains a prior accepted result.
{
  const brain = createRoadBrain();
  brain.process(observation());
  brain.process(observation());
  const retained = brain.process(observation({ roadName: 'unknown' }));
  assert.strictEqual(retained.outcome, 'RETAINED_UNCONFIRMED');
  assert.strictEqual(retained.accepted.limit, 50);
  assert.strictEqual(retained.accepted.road, 'Badenerstrasse');
}

// Missing/non-positive mapped limit produces NO_LIMIT without inventing accepted state.
{
  const brain = createRoadBrain();
  const result = brain.process(observation({ limit: 0 }));
  assert.strictEqual(result.outcome, 'NO_LIMIT');
  assert.strictEqual(result.accepted, null);
}

// Candidate histories are capped at three entries.
{
  const brain = createRoadBrain();
  brain.process(observation({ limit: 30, roadName: 'Road A' }));
  brain.process(observation({ limit: 40, roadName: 'Road B' }));
  brain.process(observation({ limit: 50, roadName: 'Road C' }));
  brain.process(observation({ limit: 60, roadName: 'Road D' }));
  const state = brain.getState();
  assert.strictEqual(state.candidateKeys.length, 3);
  assert.strictEqual(state.candidateLimits.length, 3);
  assert.deepStrictEqual(state.candidateLimits, [40, 50, 60]);
}

// Reset clears all algorithmic state.
{
  const brain = createRoadBrain();
  brain.process(observation());
  brain.process(observation());
  brain.reset();
  assert.deepStrictEqual(brain.getState(), {
    candidateLimits: [],
    candidateKeys: [],
    acceptedLimit: null,
    acceptedRoad: '',
    acceptedPosition: null
  });
}

// Spatial freshness is fresh below 60m and stale at/above 60m.
{
  const brain = createRoadBrain();
  brain.process(observation());
  brain.process(observation());
  const near = brain.freshnessForPosition({ latitude: 47.0001, longitude: 8 });
  assert.strictEqual(near.fresh, true);
  assert.ok(near.distanceMetres < 60);
  const far = brain.freshnessForPosition({ latitude: 47.001, longitude: 8 });
  assert.strictEqual(far.fresh, false);
  assert.ok(far.distanceMetres >= 60);
}

console.log('Road Brain v1 contract tests passed.');
