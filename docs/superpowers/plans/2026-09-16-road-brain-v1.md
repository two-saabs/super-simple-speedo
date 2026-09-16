# Road Brain v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the existing automatic road/speed-limit decision algorithm into a deterministic Road Brain while preserving current behaviour.

**Architecture:** Keep Geoapify parsing/networking in the application as an adapter. Feed neutral observations into `brains/road-brain.js`; return canonical decisions consumed by the existing UI, diagnostics and Transport sampling. Preserve the existing 60 m spatial-freshness rule without adding time staleness.

**Tech Stack:** CommonJS JavaScript, Node assertions/tests, existing HTML/build transform pipeline.

**Spec:** `docs/superpowers/specs/2026-09-16-road-brain-v1-design.md`

## Global Constraints

- Road Brain version starts at exactly `1.0.0`.
- This is behaviour-preserving extraction, not algorithm improvement.
- Geoapify JSON parsing and HTTP remain outside Road Brain.
- Preserve <=30 m quality threshold, moving=2 matches, stationary=3 matches, three-candidate history, `service_other` rejection, residential >70 rejection, accepted-match fast confirmation, and 60 m spatial freshness.
- Do not add time-based staleness.
- Do not change Speed Brain, Transport scoring, manual-limit behaviour, UI design, rotation behaviour, or lookup cadence.

---

### Task 1: Characterisation tests for the existing Road contract

**Files:**
- Create: `tests/test-road-brain.js`
- Read/reference: `index.template.html`
- Read/reference: `build/road-freshness-fix.js`

**Interfaces:**
- Consumes: frozen behaviour in the spec.
- Produces: executable contract tests for `sanitiseRoadName`, `createRoadBrain().process()`, `reset()`, and `freshnessForPosition()`.

- [ ] **Step 1: Write failing tests** covering: technical-name filtering; house-number suffix removal; `A3W, Sihlhochstrasse` preservation; two moving matches; three stationary matches; bad accuracy; `service_other`; `unmatched`; residential 80 rejection; already-accepted immediate reconfirmation; retained accepted result on invalid unnamed observation; `NO_LIMIT`; three-entry history; reset; and fresh vs >=60 m position.

Use plain Node `assert` and import:

```js
const assert = require('assert');
const { ROAD_BRAIN_VERSION, createRoadBrain, sanitiseRoadName } = require('../brains/road-brain');
assert.strictEqual(ROAD_BRAIN_VERSION, '1.0.0');
```

Representative moving confirmation:

```js
const brain = createRoadBrain();
const observation = { limit: 50, roadName: 'Badenerstrasse', roadClass: 'primary', matchType: 'matched', accuracyMetres: 10, speedKmh: 30, position: { latitude: 47, longitude: 8 } };
assert.strictEqual(brain.process(observation).outcome, 'BEST_ESTIMATE');
assert.strictEqual(brain.process(observation).outcome, 'CONFIRMED');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/test-road-brain.js`

Expected: FAIL because `brains/road-brain.js` does not exist.

- [ ] **Step 3: Commit the characterisation test**

```bash
git add tests/test-road-brain.js
git commit -m "test: capture Road Brain v1 contract"
```

### Task 2: Implement the standalone Road Brain

**Files:**
- Create: `brains/road-brain.js`
- Test: `tests/test-road-brain.js`

**Interfaces:**
- Consumes: neutral observation defined in the spec.
- Produces: `ROAD_BRAIN_VERSION`, `sanitiseRoadName(raw)`, `createRoadBrain()`, whose instance exposes `process(observation)`, `reset()`, `getState()`, `freshnessForPosition(position)`.

- [ ] **Step 1: Implement minimal deterministic state and sanitisation**

State shape:

```js
{
  candidateLimits: [],
  candidateKeys: [],
  acceptedLimit: null,
  acceptedRoad: '',
  acceptedPosition: null
}
```

`sanitiseRoadName` must exactly reproduce the frozen rules. Keep all DOM, fetch, localStorage and audio references out of this file.

- [ ] **Step 2: Implement `process(observation)`** using candidate key `${roundedLimit}|${road}`; push/slice histories to three; compute `qualityGood`, `stationary`, `requiredMatches`, `repeatedMatch`, `matchesAccepted`; return one of the four canonical outcomes. On `CONFIRMED`, update accepted state and accepted position. On `RETAINED_UNCONFIRMED`, preserve accepted state. On `BEST_ESTIMATE`, do not overwrite accepted state.

Canonical return shape:

```js
{
  outcome: 'CONFIRMED',
  candidate: { limit: 50, road: 'Badenerstrasse' },
  accepted: { limit: 50, road: 'Badenerstrasse', position: { latitude: 47, longitude: 8 } },
  display: { limit: 50, road: 'Badenerstrasse' },
  confidenceChecks: { qualityGood: true, repeatedMatch: true, requiredMatches: 2, stationary: false, invalidRoadClass: false, implausibleRoadLimit: false, validRoadName: true },
  roadEvidenceConfirmed: true
}
```

- [ ] **Step 3: Implement spatial freshness** with haversine distance and `freshnessForPosition(position)` returning `{ fresh, distanceMetres }`; accepted state is fresh below 60 m and not fresh at/above 60 m. No clock input or age field.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node tests/test-road-brain.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add brains/road-brain.js tests/test-road-brain.js
git commit -m "feat: add Road Brain v1"
```

### Task 3: Inject Road Brain into both build runtimes

**Files:**
- Create: `build/road-brain-runtime.js`
- Modify: `build.js`
- Modify: `build-ios.js`
- Create: `tests/test-road-brain-integration.js`

**Interfaces:**
- Consumes: CommonJS exports from `brains/road-brain.js`.
- Produces: browser global `window.FrenanoRoadBrain = Object.freeze({ version, createRoadBrain, sanitiseRoadName })` before the app IIFE runs.

- [ ] **Step 1: Write failing integration assertions** that both builders read `brains/road-brain.js`, inject it before the application IIFE, and expose version/create/sanitise functions. Follow the existing `build/speed-brain-runtime.js` injection pattern.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/test-road-brain-integration.js`

Expected: FAIL because Road Brain runtime injection is absent.

- [ ] **Step 3: Implement `injectRoadBrainRuntime(html, brainSource)`** analogous to Speed Brain runtime injection, with script id `frenano-road-brain-v1` and fail-fast marker checks.

- [ ] **Step 4: Wire both builders** to import `ROAD_BRAIN_VERSION`, read `brains/road-brain.js`, inject runtime, and make the version available to diagnostics metadata only if the existing diagnostics interface accepts extension without changing its current fields; otherwise leave diagnostics version metadata for a later task.

- [ ] **Step 5: Run tests and build smoke checks**

Run:

```bash
node tests/test-road-brain-integration.js
GEOAPIFY_API_KEY=test-key npm run build
GEOAPIFY_API_KEY=test-key npm run build:ios
```

Expected: tests PASS and both builds complete.

- [ ] **Step 6: Commit**

```bash
git add build/road-brain-runtime.js build.js build-ios.js tests/test-road-brain-integration.js
git commit -m "build: inject Road Brain runtime"
```

### Task 4: Replace inline road decision state with Road Brain

**Files:**
- Modify: `index.template.html` around `displayRoadName`, `candidateConfirmation`, `lookupSpeedLimit`, automatic-mode reset, and transport sampling.
- Modify: `build/road-freshness-fix.js`
- Modify: `tests/test-road-brain-integration.js`

**Interfaces:**
- Consumes: `window.FrenanoRoadBrain.createRoadBrain()`.
- Produces: one `roadBrain` instance whose canonical state replaces inline `autoCandidates`, `autoMatchCandidates`, `acceptedAutoLimit`, `acceptedAutoRoad`, and `acceptedAutoPosition` as algorithmic ownership.

- [ ] **Step 1: Extend integration test to fail unless the app creates exactly one Road Brain instance and `lookupSpeedLimit()` calls `roadBrain.process()` with a neutral observation after Geoapify parsing.** Assert that provider-specific `legs`, `waypoints`, `step_index` and `leg_index` parsing remains in `index.template.html`, not `brains/road-brain.js`.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/test-road-brain-integration.js`

Expected: FAIL because inline decision logic still owns confirmation.

- [ ] **Step 3: Instantiate Road Brain** near existing Speed Brain setup and make `displayRoadName(raw)` delegate to `FrenanoRoadBrain.sanitiseRoadName(raw)` so stale/cached UI values keep identical sanitisation.

- [ ] **Step 4: Adapt Geoapify result to neutral observation** after current step selection:

```js
const roadDecision = roadBrain.process({
  limit: Number(step?.speed_limit),
  roadName: step?.name || step?.road_class || '',
  roadClass: step?.road_class || null,
  matchType: latest?.match_type || (step ? 'matched' : 'unmatched'),
  accuracyMetres: Number(currentCoords.accuracy),
  speedKmh: state.targetSpeed,
  position: { latitude: currentCoords.latitude, longitude: currentCoords.longitude }
});
```

- [ ] **Step 5: Map canonical outcomes to existing presentation without copy changes:** `CONFIRMED` -> current confirmed `setLimit`/`setAutomaticStatus('matched')`; `RETAINED_UNCONFIRMED` -> retained last-confirmed presentation; `BEST_ESTIMATE` -> current candidate presentation; `NO_LIMIT` -> existing no-data status. Preserve limit-change chime comparison using the previous accepted limit captured before processing.

- [ ] **Step 6: Remove inline `candidateConfirmation()` and algorithmic candidate-history mutation.** Keep compatibility mirrors in `state` only if diagnostics/UI still require them, deriving them from `roadBrain.getState()` rather than independently deciding anything.

- [ ] **Step 7: Move 60 m freshness decision to Road Brain.** Change `build/road-freshness-fix.js` so it no longer injects accepted-position ownership or its own distance threshold; it may inject only presentation wiring that calls `roadBrain.freshnessForPosition(c)`. Ensure no duplicate 60 m rule remains outside the brain.

- [ ] **Step 8: Feed Transport from canonical evidence.** Where movement samples currently infer road confirmation from UI/app state, use Road Brain's accepted/fresh decision. Do not alter classifier weights or thresholds.

- [ ] **Step 9: Run contract + integration + existing quality suite**

```bash
node tests/test-road-brain.js
node tests/test-road-brain-integration.js
npm run quality
```

Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add index.template.html build/road-freshness-fix.js tests/test-road-brain-integration.js
git commit -m "refactor: route road decisions through Road Brain"
```

### Task 5: Regression matrix and ownership guard

**Files:**
- Modify: `tests/check-build-ownership.js`
- Modify: `TEST-COVERAGE.md`
- Test: `tests/test-road-brain.js`
- Test: `tests/test-road-brain-integration.js`

**Interfaces:**
- Consumes: completed extraction.
- Produces: guardrails preventing road algorithm logic from drifting back into UI/build transforms.

- [ ] **Step 1: Add ownership assertions** requiring `brains/road-brain.js` and rejecting duplicate confirmation constants/logic in `index.template.html` and `build/road-freshness-fix.js` (30 m quality threshold, 2/3 confirmation threshold, 60 m freshness threshold must have one algorithmic owner).

- [ ] **Step 2: Update `TEST-COVERAGE.md`** with Road Brain unit coverage, adapter/integration coverage, spatial freshness coverage, and explicit non-coverage of live Geoapify correctness.

- [ ] **Step 3: Run the full deterministic suite**

```bash
node tests/test-road-brain.js
node tests/test-road-brain-integration.js
node tests/check-build-ownership.js
npm run quality
GEOAPIFY_API_KEY=test-key npm run build
GEOAPIFY_API_KEY=test-key npm run build:ios
```

Expected: all PASS; both builds complete.

- [ ] **Step 4: Inspect generated `dist/app/index.html` and iOS generated app HTML** to verify both contain `frenano-road-brain-v1` before the app script and do not contain a second inline copy of candidate-confirmation logic.

- [ ] **Step 5: Commit**

```bash
git add tests/check-build-ownership.js TEST-COVERAGE.md
git commit -m "test: guard Road Brain ownership"
```

### Task 6: Final parity gate before promotion

**Files:**
- No new production files expected.
- Fix only files already named above if verification exposes a regression.

**Interfaces:**
- Consumes: complete Road Brain extraction.
- Produces: evidence that the refactor is safe to promote through the normal branch path.

- [ ] **Step 1: Run every Road/quality/build command from Task 5 from a clean checkout/worktree.** Expected: zero failures.

- [ ] **Step 2: Review diff specifically for forbidden scope changes:** UI copy/layout, Speed Brain, transport weights, lookup cadence, manual mode, rotation, new timers. Expected: none.

- [ ] **Step 3: Perform manual scenario parity on the test build:** first valid moving candidate shows Best estimate; second confirms; stationary requires three; invalid road retains prior confirmed limit; moving 60 m from confirmation downgrades presentation pending refresh; manual limit still works; Speed Brain display remains unchanged.

- [ ] **Step 4: Record verification evidence in the PR/commit notes and stop.** Do not promote to production until this gate is green and reviewed.

## Self-review

Spec coverage: all frozen behaviours, provider boundary, spatial freshness, Transport contract and non-goals map to Tasks 1-6. Placeholder scan: no TBD/TODO implementation placeholders. Type consistency: `createRoadBrain`, `process`, `reset`, `getState`, `freshnessForPosition`, and `sanitiseRoadName` are named consistently throughout.