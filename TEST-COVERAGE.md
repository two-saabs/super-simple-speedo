# Frenano experimental test coverage

This branch currently preserves the pre-Frenano experimental baseline. Its quality gate is intentionally labelled **legacy baseline** so a green check cannot be mistaken for validation of current Frenano branding or packaging.

The branch still runs its regression, privacy, speed-behaviour, release-channel and build checks. CI now also reports Node/V8 code coverage for the legacy core `speed-engine.js` behaviour suite.

## Current limitation

Before this branch is used for new Frenano experiments, it should be migrated/rebased onto the current `frenano-webapp-test` baseline. Until then, its checks protect the historical experimental implementation rather than the current Frenano product surface.

## Coverage command

```bash
node --test --experimental-test-coverage test-speed-engine.js
```

Do not compare its percentage directly with the current Frenano branches: the source layout and test harness are from a different baseline.
