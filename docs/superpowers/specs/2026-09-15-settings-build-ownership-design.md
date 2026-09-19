# Settings Build Ownership Cleanup Design

> Historical implementation document. Transport/Journey preservation or integration requirements below are superseded by the 2026-09-19 purge; they do not require restoring the removed subsystem.

## Goal

Reduce hidden coupling in Frenano's build-time HTML transformation chain without changing the generated user experience or the Speed, Road, or Transport algorithms.

## Current problem

`build.js` applies a sequence of historical transforms to `index.template.html`. Several transforms no longer have a single responsibility. In particular, `build/settings-redesign.js` contains Settings presentation changes alongside statistics collection, speed-unit conversion, dial rendering changes, and road-identification counters. `build/settings-polish.js` then modifies the Settings UI again, while `build/help-contact-privacy-fix.js` also owns parts of help/privacy content.

This makes apparently safe UI work capable of changing speedometer behaviour and makes transform ordering an implicit dependency.

## Design principles

1. Zero intended visible or behavioural change.
2. `ios-prod` remains frozen; all cleanup happens on `ios-test` first.
3. Preserve the current generated output as the golden reference wherever deterministic output allows it.
4. Preserve all existing Speed Engine fixtures, privacy contracts, keep-awake tests, branding/onboarding contracts, iOS packaging contracts, and simulator UI tests.
5. One owner per concern: Settings presentation should not own speed calculation/display behaviour, road counters, or statistics collection.
6. Do not alter Speed, Road, or Transport algorithms in this cleanup.
7. Make small independently verified moves rather than rewriting the build system.

## Scope

### In scope

- Map and protect the current Settings-related generated output before moving code.
- Extract non-Settings behavioural replacements currently embedded in `build/settings-redesign.js` into clearly named build transforms/modules.
- Keep Settings UI transforms focused on Settings markup, styling, copy, location-permission UI, and Settings-specific event wiring.
- Make transform ownership/order explicit in `build.js`.
- Consolidate overlapping Settings transforms only where output equivalence can be demonstrated safely.

### Out of scope

- Any redesign of the Settings screen.
- Copy changes.
- New settings or features.
- Changes to speed filtering, road matching/freshness, transport inference, or their thresholds.
- ES-module conversion of `index.template.html`.
- Speed/Road/Transport Brain extraction.
- Changes to `ios-prod` during development.

## Proposed ownership

- `build/settings-redesign.js`: Settings presentation and Settings-specific markup only during the transition; ultimately renamed/consolidated only if doing so is output-neutral.
- `build/settings-polish.js`: temporary Settings post-processing; merge into the Settings owner only after regression protection proves equivalence.
- `build/help-contact-privacy-fix.js`: retain only non-Settings help/privacy responsibilities; Settings-specific portions migrate to the Settings owner.
- New focused behavioural transform(s): own existing statistics bookkeeping, unit/display conversion, and related non-Settings replacements currently hidden inside `settings-redesign.js`. These are structural relocations of existing code, not algorithm changes.
- `build.js`: sole orchestration owner and explicit ordering point.

## Verification strategy

Before each production-code move, add a regression test/contract that fails when the relevant current behaviour or generated structure is absent. Then move the smallest coherent block and require the new test plus the complete quality gate to pass.

For deterministic generated HTML, compare protected snippets/markers rather than build timestamps. Behavioural replacements use existing Speed Engine fixtures plus focused regression contracts for units/statistics/road-count behaviour as needed.

A task is complete only when the full `Frenano quality gate` is green on the exact `ios-test` commit. No promotion to `ios-prod` is part of this design.

## Success criteria

- Generated Frenano UI remains visually and textually unchanged.
- Existing speed behaviour fixtures remain identical.
- Settings-related transforms no longer contain unrelated speed/dial/road/statistics ownership.
- `build.js` clearly shows which transform owns each concern.
- Full quality gate is green on `ios-test`.
