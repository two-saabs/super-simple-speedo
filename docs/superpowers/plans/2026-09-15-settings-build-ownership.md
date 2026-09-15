# Settings Build Ownership Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Untangle Settings build ownership while preserving Frenano's current generated UI and behaviour exactly.

**Architecture:** Keep `build.js` as the sole transform orchestrator. First add regression contracts for the behaviour currently hidden in `settings-redesign.js`, then relocate those replacements into focused build modules one coherent concern at a time; only after that consider merging overlapping Settings-only transforms.

**Tech Stack:** Node.js build scripts, plain JavaScript/HTML/CSS, GitHub Actions, existing Frenano regression scripts and iOS UI tests.

**Spec:** `docs/superpowers/specs/2026-09-15-settings-build-ownership-design.md`

## Global Constraints

- Zero intended visible or behavioural change.
- `ios-prod` remains frozen; all cleanup happens on `ios-test` first.
- Do not alter Speed, Road, or Transport algorithms.
- Preserve current onboarding, branding, privacy, help, and Settings copy exactly.
- Every production-code move must be preceded by a regression test that is observed failing for the intended reason.
- Run the complete Frenano quality gate after each coherent extraction before continuing.

---

### Task 1: Protect hidden non-Settings behaviour

**Files:**
- Modify: existing regression/contract test scripts selected from the current quality-gate suite
- Inspect: `build/settings-redesign.js`
- Inspect: `.github/workflows/quality-gate.yml`

**Interfaces:**
- Consumes: current generated `dist/app/index.html` and existing build/test entry points
- Produces: regression contracts covering current unit conversion, statistics bookkeeping, road-identification counting, and dial/display hooks that are currently injected by `settings-redesign.js`

- [ ] **Step 1: Identify the smallest existing test harness that can exercise each hidden behaviour without changing production code.**
- [ ] **Step 2: Add one focused regression assertion for the first extraction target.**
- [ ] **Step 3: Temporarily prove the assertion is meaningful by running it against a deliberately absent/incorrect marker or equivalent test-only negative condition; confirm RED for the intended reason.**
- [ ] **Step 4: Restore the real expectation and confirm GREEN against the current golden implementation.**
- [ ] **Step 5: Repeat only for behaviour needed by the first extraction; do not create speculative tests.**
- [ ] **Step 6: Commit the regression protection independently.**

### Task 2: Extract statistics ownership from Settings

**Files:**
- Create: `build/usage-statistics.js` (name may be adjusted only if repository inspection reveals an existing canonical owner)
- Modify: `build/settings-redesign.js`
- Modify: `build.js`
- Test: contracts added in Task 1

**Interfaces:**
- Consumes: HTML string
- Produces: `applyUsageStatistics(html)` returning the transformed HTML with exactly the existing statistics state/defaults, max-speed bookkeeping, road-count bookkeeping, reset behaviour, and display hooks formerly injected by `settings-redesign.js`

- [ ] **Step 1: Ensure the focused statistics regression contract is RED if the existing statistics replacement block is removed in an isolated test branch/change.**
- [ ] **Step 2: Move the exact existing statistics replacement snippets into `applyUsageStatistics(html)` without editing their behaviour.**
- [ ] **Step 3: Call the new transform explicitly from `build.js` at the dependency-equivalent point.**
- [ ] **Step 4: Remove only those exact replacements from `settings-redesign.js`.**
- [ ] **Step 5: Run focused contracts and confirm GREEN.**
- [ ] **Step 6: Run the complete quality gate and require GREEN.**
- [ ] **Step 7: Commit the extraction.**

### Task 3: Extract speed-unit/dial display ownership from Settings

**Files:**
- Create: `build/speed-display-units.js` (or reuse an existing canonical display owner if discovered)
- Modify: `build/settings-redesign.js`
- Modify: `build.js`
- Test: focused display/unit regression contracts

**Interfaces:**
- Consumes: HTML string
- Produces: `applySpeedDisplayUnits(html)` containing the exact existing km/h↔mph display conversion, dataset preservation, dial maximum/tick conversion, and unit UI wiring currently hidden in Settings redesign

- [ ] **Step 1: Add/verify a failing focused contract for the current unit/display hooks.**
- [ ] **Step 2: Move the existing replacement code byte-for-byte where practical into the focused transform.**
- [ ] **Step 3: Wire the transform explicitly in `build.js` preserving ordering.**
- [ ] **Step 4: Remove only the moved replacements from `settings-redesign.js`.**
- [ ] **Step 5: Run focused tests, existing Speed Engine fixtures, and full quality gate; require GREEN.**
- [ ] **Step 6: Commit the extraction.**

### Task 4: Consolidate Settings-only ownership

**Files:**
- Modify: `build/settings-redesign.js`
- Modify: `build/settings-polish.js`
- Modify: `build/help-contact-privacy-fix.js`
- Modify: `build.js`
- Test: generated Settings/copy/location-permission contracts and iOS UI regression suite

**Interfaces:**
- Consumes: HTML string and `{ appVersion, buildChannel }` where required
- Produces: one clearly documented Settings owner plus only genuinely non-Settings help/privacy responsibilities outside it

- [ ] **Step 1: Inventory the remaining responsibilities after Tasks 2–3 and identify only overlapping Settings concerns.**
- [ ] **Step 2: Add a focused regression contract for any Settings structure/copy that is not already protected.**
- [ ] **Step 3: Verify RED for the intended missing/changed contract.**
- [ ] **Step 4: Move one Settings-only concern at a time into the chosen Settings owner, preserving markup/CSS/JS output.**
- [ ] **Step 5: After each move, run focused contracts.**
- [ ] **Step 6: Remove a historical transform only when it has no remaining responsibility.**
- [ ] **Step 7: Run full quality gate and iOS simulator UI suite; require GREEN.**
- [ ] **Step 8: Commit the consolidation.**

### Task 5: Verify architecture and stop before Brain work

**Files:**
- Inspect: `build.js`
- Inspect: `build/*.js`
- Modify: design/architecture notes only if final ownership differs from the planned names while preserving the same boundaries

**Interfaces:**
- Produces: explicit build ownership map and a green `ios-test` baseline ready for separate Brain-refactor planning

- [ ] **Step 1: Confirm Settings transforms contain no speed filtering, road matching/freshness algorithm, transport inference, or unrelated statistics/display ownership.**
- [ ] **Step 2: Confirm `build.js` is the sole orchestrator between independent transforms.**
- [ ] **Step 3: Run the complete quality gate on the exact final `ios-test` SHA.**
- [ ] **Step 4: Compare final generated product contracts with the pre-cleanup golden baseline and investigate any difference.**
- [ ] **Step 5: Stop. Do not promote to `ios-prod` and do not begin Speed Brain extraction without a separate decision.**
