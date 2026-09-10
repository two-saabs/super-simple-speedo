# Frenano test coverage

This document tracks *what* Frenano protects with automated tests. It complements code-coverage percentages: a high line-coverage number does not prove that the important driving behaviours are covered.

## Current automated coverage

| Area | Status | Automated protection |
| --- | --- | --- |
| Core speed calculation | ✅ | Behaviour fixtures replay `speed-engine.js`; CI also reports Node/V8 code coverage for the engine. |
| Stationary start | ✅ | Fixture: `01-stationary-start.json`. |
| Impossible GPS jump | ✅ | Fixture: `02-impossible-gps-jump.json`. |
| Normal native driving | ✅ | Fixture: `03-normal-native-drive.json`. |
| Derived-speed startup | ✅ | Fixture: `04-derived-start-needs-confirmation.json`. |
| Poor GPS accuracy | ✅ | Fixture: `05-poor-accuracy-derived-speed.json`. |
| Driver-mode exit / deceleration | ✅ | Fixture: `06-driver-mode-exit.json`. |
| Long GPS gap / tunnel-style recovery | ✅ | Fixture: `07-long-gap-recovery.json`. |
| Missing native speed | ✅ | Fixture: `08-speed-unavailable.json`. |
| Impossible absolute speed | ✅ | Fixture: `09-absolute-speed-rejection.json`. |
| Native speed vs coordinate contradiction | ✅ | Fixture: `10-native-derived-contradiction.json`. |
| Very short GPS sample interval | ✅ | Fixture: `11-short-sample-interval.json`. |
| High-speed startup confirmation | ✅ | Fixture: `12-high-speed-start-confirmation.json`. |
| Sudden derived stop confirmation | ✅ | Fixture: `13-sudden-derived-stop.json`. |
| Derived direction reversal / GPS wobble | ✅ | Fixture: `14-derived-direction-reversal.json`. |
| Large native speed jump confirmation | ✅ | Fixture: `15-large-native-speed-jump.json`. |
| Diagnostics schema and persistence | ✅ | Regression contracts validate timestamps, schema versioning, event creation, storage, trimming, session markers and export behaviour. |
| Road lookup / road freshness | ✅ contract | Regression/build contracts protect confirmed-road state, stale-road distance behaviour, candidate roads and speed-limit UI state. |
| Geoapify proxy | ✅ contract | CI checks server-side key usage, reverse/map-matching actions and CORS contract. |
| Privacy | ✅ | Dedicated privacy contract suite plus checks that secrets/analytics are not introduced. |
| Release-channel isolation | ✅ | Dedicated channel-contract suite checks stable/test/experimental behaviour. |
| Web startup | ✅ contract | Build output is checked for Frenano startup assets and the web `Let’s go!` flow. |
| Native iOS startup | ✅ package | iOS CI verifies native packaging and automatic startup without the web button. |
| Frenano branding/assets | ✅ | CI checks required production PNGs and built output branding. |
| Settings/support UI | ✅ contract | Regression/build checks protect settings sections, support address, diagnostic sharing and hidden experimental controls. |
| Transport classifier | ✅ contract | Regression contracts cover walking, bus, car, tram and train scoring plus hysteresis. |
| Journey mode | ✅ contract | Regression contracts cover segment creation, waiting delay and transport-engine dependency. |
| Swiss public-transport matching | ✅ contract | Regression contracts protect stationboard/location API integration, timetable evidence and transit-match diagnostics. |
| Native iOS UI interactions | 🟡 limited | UI-test source exists, but native interaction coverage is still much smaller than the JavaScript/build contract suite. |
| Live external road/timetable services | 🟡 integration/manual | CI validates our contracts; real provider availability and real-world matching still require field testing. |

## Behaviour scenarios

There are currently **15 executable GPS/speed behaviour fixtures** under `tests/test-data/`. These feed sequences of samples through the real speed engine and assert decisions, rather than only checking that source-code text exists.

The current suite covers stationary behaviour, normal native driving, derived-speed confirmation, poor accuracy, impossible coordinate and speed outliers, deceleration, long GPS gaps, missing speed, native/position contradictions, short sample intervals, high-speed startup, sudden derived stops, directional GPS wobble and large native speed jumps.

The next highest-value behavioural scenarios are now broader app/integration behaviours rather than gaps in the extracted core speed engine: road switching near junctions, stale speed-limit handling, walking, bus/tram/train journeys, and long-baseline public-transport recovery.

## Code coverage

CI runs:

```bash
node --test --experimental-test-coverage tests/test-speed-engine.js
```

Current core-engine result after the 15-scenario suite:

- `speed-engine.js` line coverage: **100.00%**
- `speed-engine.js` branch coverage: **94.96%**
- `speed-engine.js` function coverage: **100.00%**

Treat this as **core-engine coverage**, not whole-app coverage: much of the product currently lives in generated/browser/native integration code that is protected by contract/build tests rather than instrumented unit tests.

## How to interpret the quality gate

A green quality gate currently means:

- all 15 core speed fixtures pass;
- required product, diagnostic and privacy contracts remain present;
- the configured release builds successfully;
- release-channel rules remain intact;
- the expected Frenano assets/branding/startup/settings are present in the built output;
- platform-specific packaging checks pass where applicable.

The next testing focus should be to extract and exercise more road-matching, transport and platform logic as executable modules while preserving these core-engine coverage levels.
