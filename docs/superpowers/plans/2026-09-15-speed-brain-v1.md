# Speed Brain v1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract Frenano's existing speed intelligence into a self-contained, deterministic, independently versioned Speed Brain v1.0.0 with zero intentional speed-behaviour change.

**Architecture:** Preserve the current `speed-engine.js` behaviour as the golden oracle, then move that logic behind a browser-and-Node-compatible `brains/speed-brain.js` interface that owns its state and explanation output. Build-time wiring makes the same Brain available to the generated web/iOS application; application code adapts normalized location observations into the Brain and consumes its result, while UI, platform, network, road and transport concerns stay outside.

**Tech Stack:** Node.js 22, CommonJS/browser JavaScript, existing HTML build transforms, existing JSON replay fixtures, GitHub Actions, Capacitor/iOS packaging.

**Spec:** `docs/superpowers/specs/2026-09-15-speed-brain-v1-design.md`

## Global Constraints

- Speed Brain v1.0.0 is an extraction, not an algorithm improvement.
- Preserve the current speed engine's observable decisions and values for equivalent input sequences.
- Do not tune thresholds, smoothing, stationary handling, GPS heuristics or confirmation logic during extraction.
- Speed Brain owns speed calculation, filtering/confirmation, required state, source selection and structured decision reasons.
- Speed Brain must not own DOM/UI rendering, unit presentation, Settings, road/speed-limit intelligence, transport intelligence, support-log formatting, localStorage preferences, platform APIs or network requests.
- Coordinates may be processed transiently where the current algorithm requires them, but must not appear in normal explanatory output or sanitized support diagnostics.
- Speed Brain version is exactly `1.0.0`, independent of Frenano app version.
- `ios-prod` must not be modified.
- Do not reset or overwrite the existing `brain-refactor` branch. It currently points to older history and is not the execution base.
- Execute from an isolated worktree/branch created from the reviewed `ios-test` checkpoint containing this plan and spec.
- Stop after implementation and verification for human review. Do not automatically merge/promote to `ios-test` or `ios-prod`.

## File Structure

- Create `brains/speed-brain.js` — canonical Speed Brain v1.0.0 implementation; usable from Node and browser; owns state and result explanation.
- Modify `speed-engine.js` — temporary/backward-compatible Node facade only, delegating to the Brain so there is one algorithm owner after extraction.
- Modify `tests/test-speed-engine.js` — replay the same fixtures through the canonical Brain and assert version/reset/interface contracts.
- Add focused fixtures under `tests/test-data/` for uncovered existing behaviours discovered from the current engine: long-gap reset, native/derived contradiction, confirmation/hold/recovery.
- Create `build/speed-brain-runtime.js` — build-time owner that injects the canonical Brain runtime into generated app HTML without introducing ES-module requirements into the current inline/IIFE application.
- Modify `build.js` — invoke the Speed Brain runtime transform before transforms that depend on application runtime behaviour.
- Modify `index.template.html` — replace duplicated inline speed-decision ownership with a small adapter that sends normalized observations to Speed Brain and maps returned fields into existing application state/diagnostics/UI consumers.
- Modify `build/support-diagnostics.js` — add `# speed_engine=1.0.0` header metadata only; do not move diagnostic formatting into the Brain.
- Modify `tests/check-build-ownership.js` — enforce one speed-algorithm owner and forbid the extracted algorithm from returning to Settings/build/UI owners.
- Modify `tests/check-privacy.js` — prove Brain version metadata does not introduce coordinates or other forbidden fields into sanitized support output.
- Modify `.github/workflows/quality-gate.yml` — watch `brains/**` and run the canonical Brain replay/coverage checks.
- Modify `TEST-COVERAGE.md` — document Speed Brain v1.0.0 coverage and the new golden scenarios.

---

### Task 1: Freeze the Existing Speed Behaviour More Completely

**Files:**
- Modify: `tests/test-speed-engine.js`
- Create: `tests/test-data/06-long-gap-reset.json`
- Create: `tests/test-data/07-native-derived-contradiction.json`
- Create: `tests/test-data/08-confirm-hold-recover.json`
- Modify: `TEST-COVERAGE.md`

**Interfaces:**
- Consumes: existing `createSpeedState()` and `processSpeedSample(state, sample, options)` from `speed-engine.js`.
- Produces: golden fixtures whose expected fields are the oracle for all later tasks.

- [ ] **Step 1: Run the current replay suite before changing anything**

Run:
```bash
node tests/test-speed-engine.js
```
Expected: all existing five fixtures pass. If not, stop and investigate before extraction.

- [ ] **Step 2: Add golden fixtures for existing uncovered branches**

Use the current `speed-engine.js` implementation as the oracle. Add three deterministic sequences using the same fixture schema already consumed by `tests/test-speed-engine.js`:

```json
{
  "name": "long location gap resets baseline",
  "samples": [
    {"latitude":47.3769,"longitude":8.5417,"timestamp":1000000,"accuracy":8,"speedMps":5.0,"expect":{"speedDecision":"ACCEPTED"}},
    {"latitude":47.3770,"longitude":8.5418,"timestamp":1016001,"accuracy":8,"speedMps":5.0,"expect":{"speedDecision":"ACCEPTED","reasonsIncludes":["LONG_LOCATION_GAP"]}}
  ]
}
```

Before committing, run this fixture through the current engine and correct only the expected values to match actual current behaviour; do not change engine code. For the contradiction fixture, construct a native speed above 35 km/h with very small position-derived movement and accuracy <= 50 so `MOVEMENT_CONTRADICTION` is exercised. For confirmation/hold/recovery, use derived-only samples (`speedMps` absent/null) that exercise `START_FROM_STATIONARY_UNCONFIRMED`, `AWAITING_CONFIRMATION`, `HELD`, and eventual `ACCEPTED_CONFIRMED` according to the existing three-sample derived confirmation rule.

- [ ] **Step 3: Run the expanded suite and verify the oracle is green**

Run:
```bash
node tests/test-speed-engine.js
node --test --experimental-test-coverage tests/test-speed-engine.js
```
Expected: all eight fixtures pass. Coverage output must include `speed-engine.js`; do not set a new percentage threshold in this extraction.

- [ ] **Step 4: Update the coverage inventory**

Change `TEST-COVERAGE.md` from five to eight executable speed fixtures and list the three new scenarios explicitly. Do not claim Road/Transport coverage changed.

- [ ] **Step 5: Commit the golden-master expansion**

```bash
git add tests/test-speed-engine.js tests/test-data/06-long-gap-reset.json tests/test-data/07-native-derived-contradiction.json tests/test-data/08-confirm-hold-recover.json TEST-COVERAGE.md
git commit -m "test: strengthen speed golden replay coverage"
```

### Task 2: Create the Canonical Speed Brain v1.0.0

**Files:**
- Create: `brains/speed-brain.js`
- Modify: `speed-engine.js`
- Modify: `tests/test-speed-engine.js`

**Interfaces:**
- Consumes normalized sample: `{ latitude:Number, longitude:Number, timestamp:Number, accuracy:Number, speedMps:Number|null }`.
- Produces `createSpeedBrain(options?)` with methods `process(sample)` and `reset()` plus immutable version metadata.
- Produces result fields preserving the current engine contract plus `brainVersion: "1.0.0"`.
- Keeps compatibility exports `DEFAULTS`, `createSpeedState`, `haversineMetres`, `processSpeedSample` from `speed-engine.js` by delegating to the canonical Brain module; there must be one algorithm implementation.

- [ ] **Step 1: Write failing Brain interface tests first**

At the top of `tests/test-speed-engine.js`, require the future module and add explicit interface checks before fixture replay:

```js
const { SPEED_BRAIN_VERSION, createSpeedBrain } = require("../brains/speed-brain");
assert.equal(SPEED_BRAIN_VERSION, "1.0.0");
const brain = createSpeedBrain();
assert.equal(typeof brain.process, "function");
assert.equal(typeof brain.reset, "function");
const first = brain.process({ latitude:47.3769, longitude:8.5417, timestamp:1000, accuracy:8, speedMps:0 });
assert.equal(first.brainVersion, "1.0.0");
brain.reset();
const afterReset = brain.process({ latitude:47.3769, longitude:8.5417, timestamp:1000, accuracy:8, speedMps:0 });
assert.deepEqual(afterReset, first);
```

- [ ] **Step 2: Run the test and verify RED**

Run:
```bash
node tests/test-speed-engine.js
```
Expected: FAIL because `../brains/speed-brain` does not exist.

- [ ] **Step 3: Move the existing algorithm into the Brain without redesigning it**

Create `brains/speed-brain.js`. Move, rather than reinterpret, the current `DEFAULTS`, state initialization, `haversineMetres`, driver-mode update and `processSpeedSample` logic. Add only the v1 facade/version layer:

```js
"use strict";

const SPEED_BRAIN_VERSION = "1.0.0";

// DEFAULTS and the existing algorithm follow unchanged in semantics.

function createSpeedBrain(options = {}) {
  let state = createSpeedState();
  return Object.freeze({
    version: SPEED_BRAIN_VERSION,
    process(sample) {
      return { ...processSpeedSample(state, sample, options), brainVersion: SPEED_BRAIN_VERSION };
    },
    reset() {
      state = createSpeedState();
    }
  });
}

module.exports = {
  SPEED_BRAIN_VERSION,
  DEFAULTS,
  createSpeedState,
  haversineMetres,
  processSpeedSample,
  createSpeedBrain
};
```

Do not rename existing decision/reason strings or change constants/branches while moving them.

- [ ] **Step 4: Turn `speed-engine.js` into a compatibility facade**

Replace its algorithm body with:

```js
"use strict";
module.exports = require("./brains/speed-brain");
```

This keeps old test/tool imports working while making `brains/speed-brain.js` the sole algorithm owner.

- [ ] **Step 5: Replay both compatibility and canonical interfaces**

Keep fixture replay through the compatibility exports for regression safety, and add a second loop using a fresh `createSpeedBrain()` per fixture. Strip only `brainVersion` when comparing to old expectations that do not name it; when a fixture explicitly expects `brainVersion`, require `1.0.0`.

Run:
```bash
node tests/test-speed-engine.js
node --test --experimental-test-coverage tests/test-speed-engine.js
```
Expected: all fixtures and interface/reset checks pass, with canonical algorithm coverage reported under `brains/speed-brain.js`.

- [ ] **Step 6: Commit the canonical Brain**

```bash
git add brains/speed-brain.js speed-engine.js tests/test-speed-engine.js
git commit -m "refactor: extract Speed Brain v1 core"
```

### Task 3: Make the Canonical Brain Available to the Browser Build

**Files:**
- Create: `build/speed-brain-runtime.js`
- Modify: `build.js`
- Modify: `tests/check-build-ownership.js`
- Modify: `.github/workflows/quality-gate.yml`

**Interfaces:**
- Consumes: canonical `brains/speed-brain.js` source.
- Produces: browser global `window.FrenanoSpeedBrain` exposing `version` and `createSpeedBrain` before the existing application IIFE executes.
- Build API: `injectSpeedBrainRuntime(html, brainSource)` returns transformed HTML or throws when its insertion contract is absent.

- [ ] **Step 1: Add failing ownership/build contracts**

Extend `tests/check-build-ownership.js` with checks that:

```js
const brainPath = 'brains/speed-brain.js';
const runtimePath = 'build/speed-brain-runtime.js';
requireCondition('Speed Brain has one canonical algorithm owner', fs.existsSync(brainPath));
requireCondition('Speed Brain browser runtime has a focused build owner', fs.existsSync(runtimePath));
const compatibilityEngine = fs.readFileSync('speed-engine.js', 'utf8');
requireCondition('legacy speed-engine is only a facade', compatibilityEngine.includes('require("./brains/speed-brain")'));
```

Also assert `build/settings-redesign.js` and `build/speed-display-units.js` do not contain `processSpeedSample`, `haversineMetres`, `MOVEMENT_CONTRADICTION`, or `AWAITING_CONFIRMATION`.

- [ ] **Step 2: Run ownership test and verify RED**

Run:
```bash
node tests/check-build-ownership.js
```
Expected: FAIL because `build/speed-brain-runtime.js` does not exist.

- [ ] **Step 3: Implement browser runtime injection without converting the app to ES modules**

Create `build/speed-brain-runtime.js`. It must transform the CommonJS footer of the canonical source for browser use, not maintain a second algorithm copy. The injected wrapper should provide a local `module.exports`, evaluate the canonical source, then expose only the public browser facade:

```js
'use strict';

function injectSpeedBrainRuntime(html, brainSource) {
  const marker = '(() => {';
  if (!html.includes(marker)) throw new Error('Speed Brain runtime injection failed: app IIFE marker not found');
  const runtime = `<script id="frenano-speed-brain-v1">\n(() => {\n  const module = { exports: {} };\n  const exports = module.exports;\n${brainSource}\n  const api = module.exports;\n  window.FrenanoSpeedBrain = Object.freeze({\n    version: api.SPEED_BRAIN_VERSION,\n    createSpeedBrain: api.createSpeedBrain\n  });\n})();\n</script>\n`;
  return html.replace(marker, runtime + marker);
}

module.exports = { injectSpeedBrainRuntime };
```

Because the canonical source begins with `"use strict"` and uses only plain JavaScript/CommonJS exports, this wrapper keeps Node and browser on one source. If lexical collisions are found, keep the canonical source inside the wrapper scope rather than renaming algorithm internals.

- [ ] **Step 4: Wire the transform into `build.js`**

Add:

```js
const { injectSpeedBrainRuntime } = require("./build/speed-brain-runtime");
```

After placeholder/release-control substitutions and before other runtime transforms that expect the application IIFE, read and inject the canonical source:

```js
html = injectSpeedBrainRuntime(html, readRequiredFile("brains/speed-brain.js"));
```

Do not make `index.template.html` an ES module.

- [ ] **Step 5: Add CI path coverage and build assertions**

Add `brains/**` to both `push.paths` and `pull_request.paths` in `.github/workflows/quality-gate.yml`. In the web and iOS package contract sections, assert the built output contains `id="frenano-speed-brain-v1"` and `1.0.0`.

- [ ] **Step 6: Verify build/runtime ownership**

Run:
```bash
node tests/check-build-ownership.js
GEOAPIFY_API_KEY=test-key-not-for-production node build.js
grep -q 'id="frenano-speed-brain-v1"' dist/app/index.html
grep -q 'window.FrenanoSpeedBrain' dist/app/index.html
```
Expected: PASS.

- [ ] **Step 7: Commit browser availability**

```bash
git add build/speed-brain-runtime.js build.js tests/check-build-ownership.js .github/workflows/quality-gate.yml
git commit -m "build: expose canonical Speed Brain runtime"
```

### Task 4: Route Frenano's Live Speed Decisions Through Speed Brain

**Files:**
- Modify: `index.template.html`
- Modify: `tests/check-regressions.js`
- Modify: `tests/check-build-ownership.js`

**Interfaces:**
- Consumes: `window.FrenanoSpeedBrain.createSpeedBrain()` and normalized location observations.
- Produces: the same existing application state/UI/diagnostic fields from the Brain result; UI formatting remains outside.

- [ ] **Step 1: Identify and pin the current inline speed-decision block before editing**

In `index.template.html`, locate the code that currently computes/updates the same fields represented by the engine contract: raw speed, derived speed, accepted/held speed, candidate confirmation, speed source, reasons, and driver-mode transition. Add regression/ownership assertions for unique algorithm tokens such as `MOVEMENT_CONTRADICTION`, `AWAITING_CONFIRMATION`, `START_FROM_STATIONARY_UNCONFIRMED`, and the 6371000 haversine radius so the test first proves those tokens exist in the pre-extraction template.

This is inspection, not permission to alter the algorithm. If the inline implementation differs semantically from `speed-engine.js`, stop: characterize that difference with a failing replay fixture and update the golden oracle before continuing.

- [ ] **Step 2: Add the RED target ownership assertions**

Change the ownership test target so it requires those algorithm tokens to be absent from `index.template.html` after extraction and present in `brains/speed-brain.js`. Also require the template to contain:

```js
window.FrenanoSpeedBrain.createSpeedBrain
```

Run:
```bash
node tests/check-build-ownership.js
```
Expected: FAIL because the template still owns the algorithm.

- [ ] **Step 3: Create one Brain instance at application/session scope**

Near the existing application state initialization, create exactly one active instance:

```js
const speedBrain = window.FrenanoSpeedBrain.createSpeedBrain();
```

When the existing application starts a genuinely new speed/GPS session or performs the current equivalent state reset, call:

```js
speedBrain.reset();
```

Do not reset on ordinary samples, orientation changes, Settings changes, road updates or UI redraws.

- [ ] **Step 4: Replace inline decision logic with normalized observation + result mapping**

At the current GPS sample handling point, build the Brain input using the values the old inline logic used:

```js
const speedResult = speedBrain.process({
  latitude: coords.latitude,
  longitude: coords.longitude,
  timestamp: position.timestamp,
  accuracy: coords.accuracy,
  speedMps: Number.isFinite(coords.speed) && coords.speed >= 0 ? coords.speed : null
});
```

Map the result into the exact existing consumers rather than moving consumers into the Brain. Use the Brain's fields:

```js
const {
  rawKmh,
  derivedKmh,
  ignoredDerivedKmh,
  displayedKmh,
  accuracyMetres,
  elapsedSeconds,
  distanceMetres,
  speedSource,
  displayDecision,
  displayReasons,
  previousAcceptedKmh,
  speedDecision,
  reasons,
  driverUiActive
} = speedResult;
```

Preserve existing diagnostic event creation, display smoothing/animation, unit conversion, statistics, Road/Transport calls and DOM updates outside the Brain. Delete the duplicated inline algorithm only after every old consumer is mapped.

- [ ] **Step 5: Verify the template no longer owns speed intelligence**

Run:
```bash
node tests/check-build-ownership.js
node tests/check-regressions.js index.template.html
node tests/test-speed-engine.js
GEOAPIFY_API_KEY=test-key-not-for-production node build.js
node tests/check-settings-ui.js dist/app/index.html
```
Expected: PASS. `brains/speed-brain.js` is the only owner of the extracted decision strings/math; the template contains the adapter call.

- [ ] **Step 6: Commit application integration**

```bash
git add index.template.html tests/check-regressions.js tests/check-build-ownership.js
git commit -m "refactor: route app speed decisions through Speed Brain"
```

### Task 5: Expose Speed Brain Version in Privacy-Safe Diagnostics

**Files:**
- Modify: `build/support-diagnostics.js`
- Modify: `tests/check-privacy.js`
- Modify: `tests/check-regressions.js`

**Interfaces:**
- Consumes: build-time constant `1.0.0`/canonical Brain version.
- Produces: sanitized report header `# speed_engine=1.0.0`; no coordinates or Brain internal state.

- [ ] **Step 1: Add failing diagnostic metadata/privacy assertions**

Add checks requiring built support diagnostics source/output to contain:

```text
# speed_engine=1.0.0
```

and continue forbidding `latitude`, `longitude`, `lat=`, `lon=`, road/station/line/destination identifiers, API keys and persistent identifiers from sanitized output.

- [ ] **Step 2: Run privacy/regression tests and verify RED**

Run:
```bash
node tests/check-privacy.js
node tests/check-regressions.js index.template.html
```
Expected: FAIL only on the missing Speed Brain header assertion.

- [ ] **Step 3: Pass the Brain version into diagnostics injection**

In `build.js`, load the canonical version without duplicating the literal:

```js
const { SPEED_BRAIN_VERSION } = require("./brains/speed-brain");
```

Change the diagnostics call to:

```js
html = injectSupportDiagnostics(html, {
  appVersion,
  buildChannel,
  experimentalFeatures,
  speedBrainVersion: SPEED_BRAIN_VERSION
});
```

Update `injectSupportDiagnostics` signature accordingly and add this header immediately after app version:

```js
"# speed_engine=${speedBrainVersion}",
```

Do not include coordinates or serialized Brain state.

- [ ] **Step 4: Verify sanitized diagnostics and build output**

Run:
```bash
node tests/check-privacy.js
node tests/check-regressions.js index.template.html
GEOAPIFY_API_KEY=test-key-not-for-production node build.js
grep -q '# speed_engine=1.0.0' dist/app/index.html
```
Expected: PASS.

- [ ] **Step 5: Commit version diagnostics**

```bash
git add build.js build/support-diagnostics.js tests/check-privacy.js tests/check-regressions.js
git commit -m "feat: report Speed Brain version in diagnostics"
```

### Task 6: Full Verification and Human-Review Stop

**Files:**
- Modify: `TEST-COVERAGE.md` only if final wording needs to reflect the completed extraction.
- No production branch changes.

**Interfaces:**
- Consumes: completed Speed Brain extraction.
- Produces: fresh verification evidence for the exact final commit.

- [ ] **Step 1: Run focused tests from a clean working tree**

Run:
```bash
node tests/test-speed-engine.js
node --test --experimental-test-coverage tests/test-speed-engine.js
node tests/check-build-ownership.js
node tests/check-regressions.js index.template.html
node tests/check-privacy.js
node tests/test-ios-keep-awake.js
```
Expected: all PASS.

- [ ] **Step 2: Build both release surfaces locally**

Run:
```bash
GEOAPIFY_API_KEY=test-key-not-for-production node build.js
node tests/check-settings-ui.js dist/app/index.html
npm install --no-package-lock
npm run build:ios
```
Expected: web build, Settings contract and iOS package build PASS; iOS package contains the Brain runtime and no temporary Geoapify key.

- [ ] **Step 3: Check the extraction diff for forbidden scope creep**

Run:
```bash
git diff ios-test...HEAD -- brains/speed-brain.js speed-engine.js index.template.html build.js build/speed-brain-runtime.js build/support-diagnostics.js tests .github/workflows/quality-gate.yml TEST-COVERAGE.md
git diff --check ios-test...HEAD
```
Review specifically for changed numeric speed thresholds, changed decision/reason strings, Road/Transport algorithm edits, UI redesign, new network calls, or coordinate leakage. Expected: none.

- [ ] **Step 4: Update `TEST-COVERAGE.md` to name the canonical owner**

Ensure the Core speed calculation row says fixtures replay `brains/speed-brain.js` and that the document states Speed Brain v1.0.0 is independently versioned. Keep claims limited to tests actually run.

- [ ] **Step 5: Commit final documentation if changed**

```bash
git add TEST-COVERAGE.md
git commit -m "docs: record Speed Brain v1 coverage"
```

Skip this commit if the file already exactly reflects the completed state.

- [ ] **Step 6: Push the isolated implementation branch and wait for the exact-SHA quality gate**

```bash
git status --short
git rev-parse HEAD
git push -u origin HEAD
```

Expected: clean working tree. Record the exact SHA. Wait for `Frenano quality gate` on that SHA and require every established quality-gate step to succeed. The known separate deep WKWebView Settings simulator accessibility limitation is not a reason to alter Speed Brain or product behaviour.

- [ ] **Step 7: Stop for human review**

Report: implementation branch, exact SHA, fixture results, coverage output summary, web/iOS build results, quality-gate run result, changed-file summary, and confirmation that `ios-prod` was untouched. Do **not** merge, promote, reset `brain-refactor`, or begin Road/Transport Brain work.
