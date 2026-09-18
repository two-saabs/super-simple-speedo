# Transport/Journey Dead Feature Purge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely remove the dormant Transport Detective and Super Simple Journey subsystems from shipped Frenano code without changing live speed, road, GPS, speed-limit, UI, or sanitised support-diagnostic behaviour.

**Architecture:** Treat Transport/Journey as a vertical subsystem: remove its presentation, persistence, runtime state, sampling/classification/session logic, transport-only lookups/diagnostics, and obsolete tests/docs together. Preserve any helper only when a currently live feature demonstrably consumes it. Add negative architectural guards so removed subsystem identifiers cannot silently return.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js contract tests, existing Frenano build scripts and 17-step quality gate.

**Spec:** Approved in chat on 2026-09-18: remove Transport Detective and Super Simple Journey completely; do not touch Speed Brain, Road Brain, GPS/speed-limit behaviour, normal Frenano UI, or sanitised support diagnostics.

## Global Constraints

- Work only on `road-brain-v1-implementation`.
- Do not merge or modify test/prod branches.
- Preserve Speed Brain and Road Brain behaviour and ownership.
- Preserve GPS, displayed speed, automatic/manual speed-limit behaviour, and current non-Transport UI.
- Preserve sanitised support diagnostics; remove only diagnostics/events whose sole purpose is Transport/Journey identification.
- Do not remove shared helpers unless repository evidence shows they are unused after the purge.
- Use TDD/removal contracts before production deletion.
- Finish with the complete existing 17-step quality gate.

---

### Task 1: Inventory the Transport/Journey subsystem

**Files:**
- Inspect: `index.template.html`
- Inspect: `build.js`
- Inspect: `build-ios.js`
- Inspect: `tests/*`
- Inspect: `docs/*`

**Interfaces:**
- Consumes: current `road-brain-v1-implementation` at/after `d42202f4`.
- Produces: an exact removal inventory grouped by UI, state/persistence, runtime algorithms, network/diagnostics, tests/build/docs, and shared dependencies.

- [ ] Search the branch for Transport Detective, Super Simple Journey, `transportDetectiveEnabled`, `journeyModeEnabled`, transport samples/history/guess/classification/session functions, transport-only lookup endpoints, storage keys, diagnostics, and UI IDs.
- [ ] For every candidate helper, identify whether any live non-Transport feature consumes it.
- [ ] Record the exact files/functions/IDs to remove and the exact shared pieces to retain.
- [ ] Do not modify production code in this task.

### Task 2: Add failing removal guards

**Files:**
- Modify or create the most appropriate architecture/integration test under `tests/`.

**Interfaces:**
- Consumes: Task 1 inventory.
- Produces: RED tests proving Transport/Journey still exists before deletion and defining the absence contract.

- [ ] Add negative assertions covering the distinctive Transport/Journey UI IDs, state flags, storage keys, classifier/session functions, and transport-only diagnostic/network identifiers from the inventory.
- [ ] Keep assertions specific enough not to prohibit legitimate generic words such as `transport` in unrelated documentation or browser APIs.
- [ ] Run the focused test and confirm it fails for the expected presence of the dormant subsystem.
- [ ] Commit the RED contract separately.

### Task 3: Remove Transport/Journey presentation and persistence

**Files:**
- Modify: `index.template.html`
- Modify other files only if Task 1 proves presentation/persistence exists there.

**Interfaces:**
- Consumes: Task 2 removal guards.
- Produces: no Transport Detective/Journey settings, controls, state flags, initialization, migration, or local-storage writes.

- [ ] Remove Transport Detective and Super Simple Journey settings/UI markup and associated CSS that has no remaining consumer.
- [ ] Remove event listeners and UI update functions used solely by those controls.
- [ ] Remove `transportDetectiveEnabled`, `journeyModeEnabled`, and associated local-storage reads/writes/defaults/migrations.
- [ ] Run the focused removal test; note remaining failures belonging to runtime logic for Task 4.
- [ ] Run existing focused UI/build smoke tests relevant to the template.
- [ ] Commit this independently reviewable slice.

### Task 4: Remove Transport/Journey runtime algorithms

**Files:**
- Modify: `index.template.html`
- Modify other runtime/build files only where Task 1 identifies subsystem ownership.

**Interfaces:**
- Consumes: live GPS/speed/road signals but removes the dormant consumer.
- Produces: no Transport/Journey sampling, history, stop detection, classification, guesses, journey sessions, or transit identification.

- [ ] Remove transport sample/history/session state and reset/clear functions.
- [ ] Remove transport classifier/scoring/guess/lock logic and journey-session logic.
- [ ] Remove calls from GPS/speed update paths whose only purpose is feeding Transport/Journey.
- [ ] Remove transport-only timers and lifecycle hooks.
- [ ] Retain shared helpers only if a live feature still calls them; otherwise remove them too.
- [ ] Run the focused removal contract until runtime-related assertions turn GREEN.
- [ ] Run Road Brain and Speed Brain focused contracts to prove their ownership/behaviour remains intact.
- [ ] Commit this slice.

### Task 5: Remove transport-only network and diagnostic paths

**Files:**
- Modify: `index.template.html`
- Modify diagnostic/build/test files identified in Task 1.

**Interfaces:**
- Consumes: Task 4 runtime removal.
- Produces: no network requests or diagnostic events whose sole purpose is identifying transport mode/route/journey; sanitised support diagnostics remain operational.

- [ ] Remove transit/route lookup code that has no live purpose after Transport/Journey removal.
- [ ] Remove transport-specific diagnostic event generation, export fields, and labels.
- [ ] Preserve GPS, speed, road lookup, screen-awake, error, and other support diagnostics still useful for the shipped product.
- [ ] Verify no API/network dependency was accidentally removed from Road Brain or automatic speed-limit lookup.
- [ ] Run focused diagnostics/privacy tests.
- [ ] Commit this slice.

### Task 6: Remove obsolete tests, build logic, and documentation

**Files:**
- Modify/delete: only tests/build/docs proven obsolete by Task 1 and Tasks 3-5.

**Interfaces:**
- Consumes: production subsystem fully removed.
- Produces: repository tests/docs describe the shipped product rather than removed experiments.

- [ ] Delete or rewrite tests that exist solely to protect Transport Detective/Super Simple Journey behaviour.
- [ ] Remove build-time transforms/constants/assets that exist solely for the removed subsystem.
- [ ] Remove or clearly archive obsolete product documentation references where appropriate; do not rewrite historical changelog facts merely because a feature was later removed.
- [ ] Run the removal guards and relevant focused tests.
- [ ] Search the entire branch again using the Task 1 inventory terms and inspect every remaining hit.
- [ ] Commit the cleanup slice.

### Task 7: Full verification and review

**Files:**
- No intended production changes unless verification exposes a concrete defect.

**Interfaces:**
- Consumes: completed purge.
- Produces: independently reviewable evidence that Frenano's live product remains intact and Transport/Journey is absent.

- [ ] Run the complete existing 17-step Frenano quality gate from a clean tracked working tree.
- [ ] Confirm all steps pass with zero failures.
- [ ] Inspect `git diff`/commit range for accidental Speed Brain, Road Brain, GPS, speed-limit, normal UI, or support-diagnostic behaviour changes.
- [ ] Run a final repository search for the exact removed subsystem identifiers and explain any intentional historical-only remnants.
- [ ] Verify web and iOS builds are included in the quality gate and pass.
- [ ] Push `road-brain-v1-implementation` only after all verification is green.
- [ ] Report commit SHA(s), quality-gate run number, files/lines removed, retained shared pieces, and any intentionally preserved historical references.
