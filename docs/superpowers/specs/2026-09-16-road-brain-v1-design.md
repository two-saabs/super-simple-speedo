# Road Brain v1 Design

**Status:** Frozen for extraction

## Goal
Extract Frenano's automatic road/speed-limit decision logic from `index.template.html` into a small, deterministic, provider-independent Road Brain without changing user-visible behaviour.

## Boundary
Geoapify remains an adapter concern. The app continues to perform HTTP, select the current matched step from Geoapify `features/properties/waypoints/legs/steps`, and convert it to a neutral observation. Road Brain never knows Geoapify JSON structure, API keys, URLs, DOM, audio, lookup cadence, GPS acquisition, diagnostics persistence, or Transport classification.

Flow: `Geoapify JSON -> app adapter -> neutral observation -> Road Brain -> canonical decision -> UI/diagnostics/Transport consumers`.

## Public API
`brains/road-brain.js` exports:

```js
const ROAD_BRAIN_VERSION = '1.0.0';
const { createRoadBrain, sanitiseRoadName } = require('./brains/road-brain');
const brain = createRoadBrain();
const result = brain.process(observation);
brain.reset();
```

Neutral observation:

```js
{
  limit: 50,                 // finite positive number, otherwise no mapped limit
  roadName: 'Badenerstrasse',
  roadClass: 'primary',
  matchType: 'matched',      // 'unmatched' retains current semantics
  accuracyMetres: 12,
  speedKmh: 37,
  position: { latitude: 47.0, longitude: 8.0 }
}
```

Canonical result includes `outcome`, `candidate`, `accepted`, `display`, `confidenceChecks`, and `roadEvidenceConfirmed`. Outcomes are exactly `CONFIRMED`, `BEST_ESTIMATE`, `RETAINED_UNCONFIRMED`, and `NO_LIMIT`.

## Frozen behaviour
Road-name sanitisation preserves current behaviour: underscores become spaces; empty/technical names (`service_other`, `service other`, `service`, `other`, `unknown`, `primary`, `secondary`, `tertiary`, `residential`, `track`, `path`) become empty; a final comma-separated component beginning with a digit is removed while route designators such as `A3W, Sihlhochstrasse` remain.

A candidate is high quality only when accuracy is finite and <= 30 m, road name is valid, road class is not `service_other`, match type is not `unmatched`, and a residential candidate does not report a limit > 70 km/h.

Candidate identity is `limit|sanitisedRoadName`. The brain retains the last three candidate identities and limits. Moving (`speedKmh >= 3`) requires two identical recent candidates; stationary (`speedKmh < 3`) requires three. An observation matching the already accepted road+limit may confirm immediately, preserving current behaviour.

On confirmation, accepted road, limit and position become the candidate. A valid finite but not-yet-confirmed candidate returns `BEST_ESTIMATE`. An invalid/unnamed current candidate while a prior accepted result exists returns `RETAINED_UNCONFIRMED` and preserves the accepted result. Missing/non-positive limit returns `NO_LIMIT` and does not invent a new accepted result.

## Spatial freshness
The current release also has a build-time road freshness patch: after moving >= 60 m from the position where the road was confirmed, the UI downgrades the confirmed presentation to `Best estimate`/matching until refreshed. This is spatial freshness, not a timer. Extraction must preserve the 60 m behaviour. Road Brain will expose accepted position and a pure `freshnessForPosition(position)` result; the app remains responsible for presentation. No time-based staleness is introduced.

## Transport contract
Transport currently consumes whether road evidence is confirmed when recording movement samples. After extraction, that boolean must come from the canonical Road Brain state/result, not reconstructed UI state. No transport scoring constants or classifier behaviour change in this project.

## State ownership
Road Brain owns candidate history, accepted automatic road, accepted automatic limit, and accepted confirmation position. The app owns manual limit mode, current rendered limit/road, lookup busy/timing/waypoints, provider/service status, GPS points, UI stage text, chimes and diagnostics.

## Non-goals
No provider change; no new road algorithm; no new confidence scoring; no time-based staleness; no lookup-frequency change; no Transport redesign; no manual-limit redesign; no UI redesign; no rotation work; no change to Speed Brain.

## Compatibility rule
This is an extraction/refactor. Given equivalent neutral observations in the same order, Road Brain v1 plus the adapter must reproduce current automatic-limit decisions and the existing 60 m freshness presentation. Any intentional behavioural improvement requires a later Road Brain version and separate work.