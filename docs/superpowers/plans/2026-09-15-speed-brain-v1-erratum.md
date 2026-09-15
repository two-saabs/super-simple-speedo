# Speed Brain v1.0.0 Plan Erratum

This file is a mandatory correction to `docs/superpowers/plans/2026-09-15-speed-brain-v1.md` and must be read before execution.

## Runtime injection ordering correction

Task 3's proposed `injectSpeedBrainRuntime()` implementation is valid, but the original placement instruction in Task 3 Step 4 is not. Do **not** inject the Speed Brain runtime before `build.js` installs the release guard.

`build.js` currently uses the first `(() => {` occurrence as the required marker for installing the release guard near the end of the build. Injecting a new Speed Brain IIFE before that replacement would make the later release-guard replacement target the Brain wrapper instead of the Frenano application IIFE.

Use this ordering instead:

1. Keep all existing build transforms and release-channel replacements in their current order.
2. Let the existing release-guard replacement of the application's `(() => {` run first.
3. After the release-guard and experimental/non-experimental substitutions are complete, but immediately before `writeOutputFile("app/index.html", html)`, run:

```js
html = injectSpeedBrainRuntime(html, readRequiredFile("brains/speed-brain.js"));
```

At that point the first `(() => {` belongs to the now-release-guarded application runtime. `injectSpeedBrainRuntime()` inserts the Brain script immediately before it, and there is no later generic `(() => {` replacement that can accidentally rewrite the Brain wrapper.

Add a build regression assertion proving both constructs survive in the generated output:

```bash
GEOAPIFY_API_KEY=test-key-not-for-production node build.js
grep -q 'id="frenano-speed-brain-v1"' dist/app/index.html
grep -q 'const EXPERIMENTAL_FEATURES =' dist/app/index.html
grep -q 'window.FrenanoSpeedBrain' dist/app/index.html
```

All other tasks, interfaces, constraints, TDD requirements, verification requirements and the human-review stop in the main implementation plan remain unchanged.