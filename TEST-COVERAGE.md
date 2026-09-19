# Frenano test coverage

This document tracks *what* Frenano protects with automated tests. It complements code-coverage percentages: a high line-coverage number does not prove that the important driving behaviours are covered.

## Current automated coverage

| Area | Status | Automated protection |
| --- | --- | --- |
| Core speed calculation | ✅ | Eight behaviour fixtures replay `brains/speed-brain.js` through both the canonical API and the legacy `speed-engine.js` facade. Another 59 frozen application-profile scenarios cover 177 events. CI also reports Node/V8 code coverage for this suite. |
| Stationary start | ✅ | Fixture: `01-stationary-start.json`. |
| Impossible GPS jump | ✅ | Fixture: `02-impossible-gps-jump.json`. |
| Normal native driving | ✅ | Fixture: `03-normal-native-drive.json`. |
| Derived-speed startup | ✅ | Fixture: `04-derived-start-needs-confirmation.json`. |
| Poor GPS accuracy | ✅ | Fixture: `05-poor-accuracy-derived-speed.json`. |
| Long location gap | ✅ | Fixture: `06-long-gap-reset.json`. |
| Native/derived contradiction | ✅ | Fixture: `07-native-derived-contradiction.json`. |
| Derived confirmation recovery | ✅ | Fixture: `08-confirm-hold-recover.json`. |
| Diagnostics schema and persistence | ✅ | Regression contracts validate timestamps, schema versioning, event creation, storage, trimming, session markers and export behaviour. The privacy suite executes the generated sanitised support formatter with sensitive sentinel values. |
| Road Brain unit coverage | ✅ | `tests/test-road-brain.js` protects road-name sanitisation, moving and stationary confirmation, quality rejection, invalid road classes and limits, retained accepted results, no-limit behaviour, three-entry candidate history, reset behaviour and Road Brain v1.0.0. |
| Road Brain adapter/integration coverage | ✅ contract | `tests/test-road-brain-integration.js` protects browser-runtime injection, the neutral Geoapify-to-Brain observation boundary, canonical decision mapping, single Brain ownership, absence of removed Transport consumers and web/iOS build integration. |
| Road Brain spatial freshness coverage | ✅ | Unit and integration contracts protect the 60 m spatial-freshness boundary and require the application/build transform to delegate freshness decisions to Road Brain rather than duplicating the threshold. |
| Road lookup / road freshness | ✅ contract | Regression/build contracts protect confirmed-road state, stale-road distance behaviour, candidate roads and speed-limit UI state. |
| Geoapify proxy | ✅ contract | CI checks server-side key usage, reverse/map-matching actions and CORS contract. |
| Privacy | ✅ | Dedicated privacy contract suite plus checks that secrets/analytics are not introduced. |
| Release-channel isolation | ✅ | Dedicated channel-contract suite checks stable/test/experimental behaviour. |
| Web startup | ✅ contract | Build output is checked for Frenano startup assets and the web `Let’s go!` flow. |
| Native iOS startup | ✅ package | iOS CI verifies native packaging and automatic startup without the web button. |
| Frenano branding/assets | ✅ | CI checks required production PNGs and built output branding. |
| Settings/support UI | ✅ contract | Regression/build checks protect settings sections, support address, diagnostic sharing and hidden experimental controls. |
| Generated Speed Brain integration | ✅ contract | The built app's Brain runtime and live GPS callback are executed together to check statistics, diagnostics ordering, timers/reset, GPS-derived fallback, startup and speed presentation. |
| Native iOS UI interactions | 🟡 limited | UI-test source exists, but native interaction coverage is still much smaller than the JavaScript/build contract suite. |
| Live external road service | 🟡 integration/manual | CI validates our contracts; real provider availability and real-world matching still require field testing. Live Geoapify correctness is not covered by deterministic CI and remains a field/integration concern. |

## Behaviour scenarios

There are currently **8 executable GPS/speed behaviour fixtures** under `tests/test-data/`. Each fixture runs against both the canonical Brain and the legacy compatibility facade, for 16 replays. The suite also compares 59 application-profile scenarios and 177 events with frozen output from the pre-extraction built speed block. Speed Brain v1.0.0 and Road Brain v1.0.0 are versioned independently from the Frenano app.

Next scenarios worth adding from real field logs:

1. GPS loss and recovery / tunnel.
2. Start at zero then accelerate normally.
3. Parallel-road ambiguity and road switching at a junction.
4. Stale speed-limit confirmation after moving away from a matched road.
5. Walking sequence.
6. Bus stop/start sequence.
7. Repeated stops with poor GPS accuracy.
8. Missing native velocity with consistent position-derived movement.
9. Sudden temporary poor accuracy during an otherwise clean journey.

Speed Brain compatibility inputs (including historical recovery input) remain frozen; the app no longer produces transit recovery evidence.

## Code coverage

CI runs:

```bash
node --test --experimental-test-coverage tests/test-speed-engine.js
```

The resulting GitHub Actions log reports statement/branch/function coverage for code exercised by the core behaviour suite. Treat this as **core-engine coverage**, not whole-app coverage: much of the product currently lives in generated/browser/native integration code that is protected by contract/build tests rather than instrumented unit tests. Road Brain is currently protected by deterministic unit and integration contracts rather than this Node/V8 percentage report.

## How to interpret the quality gate

A green quality gate currently means:

- the core speed fixtures pass;
- Road Brain's deterministic contract and application integration pass;
- required product, diagnostic and privacy contracts remain present;
- the configured release builds successfully;
- release-channel rules remain intact;
- the expected Frenano assets/branding/startup/settings are present in the built output;
- platform-specific packaging checks pass where applicable.

The goal is to improve both dimensions over time: **more executable behavioural scenarios** and **higher measured code coverage of extracted testable modules**.
