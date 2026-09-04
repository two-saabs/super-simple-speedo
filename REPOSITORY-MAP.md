# Super Simple Speedo repository map

This file is a short guide to the files and branches that are intentionally part of the project.

## Active branches

- `main` — stable web/app source.
- `test` — test build channel.
- `experimental` — experimental build channel.
- `website-product-home` — product website plus `/web` deployment wrapper.
- `appstore-v1.0` — native iOS/App Store packaging branch until the App Store workflow is consolidated.

Temporary `tmp-*`, `promote/*`, `backup/*`, `noop-*`, old `release/*`, and `cleanup-*` branches are not part of the intended long-term branch model and can be deleted once confirmed unused.

## Core application files

- `index.template.html` — main Speedo application UI and browser runtime template.
- `build.js` — builds the deployable web application into `dist`.
- `build-profile.json` — identifies the current branch/build channel.
- `version.json` — application version metadata.
- `manifest.webmanifest` — PWA install metadata and icon references.
- `service-worker.js` — offline/cache behaviour.
- `netlify.toml` — Netlify build/deployment configuration.
- `_headers` — web response/security/cache headers.

## Branding and icons

- `brand/speedo-mark.svg` — in-app brand mark currently used by the running UI.
- `brand-refresh.js` — applies the branded launch/header treatment.
- `icons/icon-192.png` — PWA icon.
- `icons/icon-512.png` — PWA icon.
- `icons/icon-1024.png` — canonical native/iOS master icon.

The PNG icon files must be complete binary PNGs. The GitHub quality gate verifies their signature, dimensions and minimum file size to prevent another corrupt-icon deployment.

## Behaviour and UI patches

- `speed-engine.js` — speed calculation/selection logic.
- `road-freshness-fix.js` — road match freshness behaviour.
- `road-card-refresh.js` — road/speed-limit card presentation.
- `startup-robustness-fix.js` — startup resilience changes.
- `settings-redesign.js` — settings UI structure.
- `help-contact-privacy-fix.js` — support/contact/privacy UI.
- `support-diagnostics.js` — privacy-sanitised diagnostics support.

These files are currently applied by the build pipeline and should not be deleted merely because their names include `fix` or `refresh`.

## Tests and quality checks

- `.github/workflows/quality-gate.yml` — CI quality gate.
- `check-regressions.js` — product regression checks.
- `check-channel-contract.js` — stable/test/experimental separation checks.
- `check-privacy.js` — production privacy checks.
- `test-speed-engine.js` and `test-data/` — repeatable speed-engine fixtures.

## Documentation worth keeping

- `DEPLOYMENT-STRATEGY.md` — deployment/channel contract.
- `BUILD-CHANNELS.md` — build-channel overview.
- `IOS-RELEASE-CONFIG.md` — iOS release setup.
- `SECURITY-DEPLOYMENT-NOTES.md` — security/deployment guidance.
- `V13-BASELINE.md` — historical baseline only; keep for now unless deliberately archived later.

Old per-patch `V13.x.x-NOTES.md` files have been removed from `main`; Git history remains the source for those historical changes.
