# Speed Brain 1.0.0: frozen application profile

The named `frenano-app-v1` profile preserves the **built** Frenano application at
`85ff675839a259a463c30a063a34da00d3089f10`. The original Node engine and live app
already differed. `createSpeedBrain()` and compatibility exports keep the legacy
15-second baseline, stationary-start threshold 5, immediate driver exit <=5,
legacy accuracy normalization and legacy exported distance helper. Both profiles
use one candidate/confirmation/filter implementation.

```js
const brain = createSpeedBrain({ profile: "frenano-app-v1" });
const result = brain.process({
  timestamp: position.timestamp,
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  speedMps: position.coords.speed,
  watchActive: state.watchId !== null
});
```

The named policy is immutable. Other tuning properties passed with this profile
are ignored; mutating its original options object does not change the session.

## Observation and numeric semantics

Coordinates, timestamp, accuracy and native speed are passed without coercion.
The application stores the timestamp as supplied and performs the original
subtractions. No clock fallback is introduced. Native speed is present when its
type is number and it is >=0, including positive Infinity. Infinity retains
`NATIVE_GPS` source and prevents derived/transit fallback, but fails finite
candidate acceptance. NaN, negatives, strings, null and absent speed are missing.

Accuracy validity is preserved internally. Missing, null, string and nonfinite
accuracy do not trigger the accurate-position movement-contradiction test.
`accuracyMetres` is finite accuracy or null; diagnostic rounding remains external.
Previous raw accuracy is retained privately for the old combined-accuracy fallback
and diagnostic `movementScore` formula. The latter is exactly
`movedMetres / Math.max(1, currentAccuracy, previousAccuracy || 0)`, or null without
a previous segment. It may be NaN or Infinity; the adapter must use the existing
`roundDiagnostic` finite-value handling. No coordinates appear in the result.

The profile resets the speed baseline strictly above 30 seconds. Stationary-start
confirmation uses previous accepted speed strictly below 6; entry remains >=10.
Distance preserves the original `toRad(b.latitude - a.latitude)` and
`2 * R * asin(sqrt(h))` arithmetic without numeric clamping or new tolerances.

`transitRecoveryKmh` remains an optional Speed Brain compatibility input. Absent,
undefined or null means no recovery. Since the 2026-09-19 Transport/Journey purge,
the live app no longer supplies this input: its rail-context adapter and buffers
are removed. The following recovery semantics describe the unchanged Brain API
and frozen historical fixtures, not a live Frenano feature.
Native speed has first priority, recovery second, ordinary derived speed third.
Recovery retains `TRANSIT_LONG_BASELINE`, its recovery reason, contradiction
exemption, two-confirmation behavior when confirmation is needed, and bypass of
derived-only start/stop/uncertainty/direction checks. Ordinary segment diagnostics
and original reason ordering remain, including `SPEED_NOT_AVAILABLE` on a first
recovered sample.

## Result and driver callback lifecycle

Normal results retain the existing speed fields plus `brainVersion: "1.0.0"`.
Application-only fields are `acceptedKmh` (latest accepted value), `movementScore`
and this fresh, detached transition object:

```js
{
  scheduleExitTimeout: false, // schedule one external callback after 5000 ms
  cancelExitTimeout: false,   // clear the adapter's actual timer handle
  applyReason: null          // or one of the existing applyDriverMode reasons
}
```

`displayedKmh` is the target speed; smoothing and unit presentation stay external.
`driverUiActive` is the delayed driver state. The adapter first maps accepted and
target speeds to its consumers, then performs timer instructions, then calls
`applyDriverMode(result.driverUiActive, result.driverTransition.applyReason)`
when the reason is non-null, preserving driver logging before speed diagnostics.
Results and their arrays/transition objects do not expose mutable internal state.

An active watch sample at >=10 cancels a pending exit and enters if needed with
`DISPLAY_SPEED_AT_OR_ABOVE_10_KMH`. An active driver at <=6 schedules an exit only
if none is pending. Repeated low samples do not restart it. A sample in (6,10)
does not cancel it. Scheduling does not change driver state.

The adapter owns the timer handle and calls the following **when the callback
actually runs**, even if there has been no new GPS sample:

```js
state.driverExitTimer = null;
const result = brain.driverExitTimeout({ watchActive: state.watchId !== null });
// Apply result.driverTransition.applyReason if non-null, as above.
```

The callback returns only `{ driverUiActive, driverTransition }`. It clears the
logical pending flag, then uses the latest accepted speed. If watch is active and
speed <=6, it exits with `BELOW_6_KMH_FOR_5_SECONDS`. If speed is above6 or watch is
inactive, it does not apply anything. In particular an inactive-watch timeout
leaves driver state active. A callback with no logical pending timer is inert;
the adapter must cancel its actual handle when instructed or when resetting.
GPS timestamps never deliver or expire callbacks.

By contrast a **sample** with `watchActive: false` cancels pending exit, sets driver
state false and returns `GPS_STOPPED` even when already false. Speed processing
still takes place. Only explicit `false` means inactive; omitted `watchActive`
defaults active in both sample and callback. An omitted callback argument means
active watch. No previous watch status is inferred. Production adapters should
always provide their current boolean watch status.

`reset()` clears speed history and logical driver state and returns undefined.
The adapter clears its external timer at the application's existing reset sites.
Visibility hiding alone must not reset Brain. Instances are independent.

## Characterization evidence and scope

`tests/test-data/app-profile/frozen.json` holds exact unrounded expectations,
including tagged undefined/NaN/Infinity values. The maintainer generator executes
the actual frozen built speed block, distance helper and driver function in a VM
with fake external timers and normalized transport evidence. Its pinned extracted
source hash rejects a different oracle. It imports no Brain implementation and
the ordinary tests require neither git history, network nor a built application.
The identity diagnostic-rounding stub captures exact math; only the output
accuracy field is normalized to finite-or-null for the normalized result contract.

Run `node tests/test-speed-engine.js`: this replays all eight unchanged legacy
fixtures through both interfaces and the focused application-profile suite.
The latter covers 59 scenarios / 177 events, exact distance/decision/reason values,
delayed callbacks, malformed observations, independent sessions and privacy.
The live adapter/build/statistics/DOM integration is checked separately, including
GPS-derived fallback and confirmation. Transport buffer integration checks were
removed with the subsystem; these frozen fixtures retain Brain compatibility coverage.
