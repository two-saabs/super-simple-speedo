# Speed Brain v1.0.0 Design

> Historical implementation document. Transport/Journey preservation or integration requirements below are superseded by the 2026-09-19 purge; they do not require restoring the removed subsystem.

Date: 2026-09-15
Status: Approved design; implementation not started
Scope: Architectural extraction of Frenano's existing speed intelligence

## Purpose

Extract Frenano's proven speed calculation and decision logic into a self-contained, deterministic, independently versioned Speed Brain without intentionally changing behaviour.

Speed Brain v1.0.0 is an extraction, not an algorithm improvement. The currently tested speed behaviour is the golden reference. Any later intelligence change must happen as an explicit later Speed Brain version.

## Design decisions

### 1. Behavioural compatibility is the primary constraint

Speed Brain v1.0.0 must reproduce the current speed engine's observable decisions for equivalent input sequences. Existing quirks remain if changing them would alter behaviour.

The extraction must not simultaneously tune thresholds, change smoothing, alter stationary handling, improve GPS heuristics, rename decision semantics in a way that breaks consumers, or otherwise redesign the algorithm.

### 2. Architecture: self-contained deterministic Brain

Use a self-contained stateful module rather than a thin wrapper around scattered application state or a new general-purpose event framework.

Conceptual data flow:

    platform location source
            |
            v
    normalized observation
            |
            v
    +---------------------------+
    | Speed Brain v1.0.0        |
    |                           |
    | speed calculation         |
    | filtering                 |
    | acceptance / rejection    |
    | stationary/noise handling |
    | required history/state    |
    | explainable decisions     |
    +---------------------------+
            |
            v
    canonical speed result
          /   \
         v     v
       UI     diagnostics

Road and Transport intelligence remain outside this boundary.

### 3. Input contract

The Brain consumes normalized observations rather than Core Location, Capacitor, browser GeolocationPosition, DOM events, or other platform-specific objects.

The exact v1 input shape must preserve the minimum data required by the existing algorithm. The current engine demonstrates that this includes timestamp, speed when supplied by GPS, accuracy, latitude, and longitude because position history is used to derive movement and confirm direction. The extraction must discover and preserve any additional required fields rather than simplifying inputs at the cost of behaviour.

Coordinates are algorithm inputs only where required for existing speed mathematics. They must not be added to the normal explanatory output.

### 4. State ownership and lifecycle

Speed Brain owns the minimum history required to make speed decisions. Consumers must not have to reproduce or understand its internal filtering state.

The current engine state includes previous GPS observation, previous accepted speed, accepted-speed timestamp, pending candidate confirmation, target speed, and driver-mode state. v1.0.0 must preserve the semantics required by this state.

The Brain exposes a clean reset/new-session lifecycle operation that returns it to initial state. Reset semantics must be deterministic and covered by tests.

### 5. Output and explainability contract

Each processed observation returns a structured result containing the canonical speed decision and enough structured explanation to understand why that decision was made.

The v1 contract should preserve the existing observable information where applicable, including:

- raw GPS speed
- position-derived speed
- canonical/displayed speed selected by the engine
- accuracy
- elapsed time and movement distance where currently produced
- speed source
- acceptance/hold/rejection decision
- structured reasons
- display decision and display reasons where these are part of current speed-engine behaviour
- driver UI activity state where currently derived by the engine
- Speed Brain version `1.0.0`

Explainability belongs to the Brain. Persistence, support-diagnostic formatting, redaction, and sharing policy do not.

### 6. Hard module boundary

Speed Brain may own:

- speed calculation
- raw-versus-derived source selection
- filtering and confirmation
- acceptance, rejection and hold decisions
- stationary/noise handling
- required historical state
- driver-mode state only to the extent that it is part of the current speed decision engine
- structured decision reasons
- deterministic reset/new-session behaviour

Speed Brain must not own:

- DOM operations or UI rendering
- dial animation, colours or labels
- km/h versus mph presentation/preferences
- Settings UI
- Geoapify or road lookup
- speed-limit intelligence
- transport identification
- support-log formatting or persistence
- localStorage preferences
- iOS/Capacitor APIs
- browser geolocation APIs
- network requests

The Brain must be runnable and testable under plain Node.js without the Frenano UI.

### 7. Independent semantic versioning

Speed Brain has its own semantic version independent of the Frenano application version.

Initial extracted version: `1.0.0`.

Future convention:

- major: incompatible Brain contract or fundamental algorithm redesign
- minor: deliberate meaningful speed-intelligence improvement with compatible contract
- patch: compatible bug fix or internal correction that does not intentionally redefine the algorithm

Frenano support diagnostics should identify both the app version and `speed_engine=1.0.0`. Future Road and Transport brains may follow the same independent-version model.

### 8. Golden-master migration strategy

The existing implementation is the behavioural oracle for v1.0.0.

Before or during extraction, strengthen replay coverage so representative sequences characterize existing behaviour. At minimum preserve coverage for stationary GPS noise, normal acceleration/deceleration, poor/questionable accuracy, native GPS versus derived-speed disagreement, rejected/held spikes, candidate confirmation, long location gaps/baseline reset, loss and recovery of usable speed, and any additional edge cases revealed by the current implementation.

Migration evidence must compare equivalent input sequences and expected outputs. The goal is not merely that generic tests remain green; the extracted Brain must produce the same decisions and relevant values as the golden behaviour, subject only to existing explicit numeric tolerances.

No production fallback or dual-running architecture is required merely for the extraction unless implementation evidence reveals a concrete need. Prefer the smallest migration mechanism that proves equivalence.

### 9. Privacy

Speed Brain may transiently process coordinates because the current algorithm uses positional movement and direction. Coordinates are not part of its normal explanatory result and must not be introduced into sanitized support diagnostics.

Existing privacy tests and diagnostic redaction remain release requirements.

### 10. Branch and release safety

Implementation work must not modify `ios-prod`. The approved production baseline remains frozen.

Implementation should start from the clean, green `ios-test` checkpoint that was reviewed before this design, using an isolated branch/worktree for the Brain work. The existing `brain-refactor` branch must be inspected before reuse; do not reset or overwrite it blindly.

The extraction should proceed in small TDD steps. Do not combine it with Road Brain, Transport Brain, unrelated build cleanup, UI redesign, or algorithm tuning.

After implementation and verification, stop for human review. Do not automatically promote or merge the work into `ios-test` or `ios-prod`.

## Verification and acceptance criteria

Speed Brain v1.0.0 is ready for review only when all of the following are demonstrated with fresh evidence:

1. Golden/replay speed fixtures pass and preserve the current engine's observable behaviour.
2. Speed Brain is independently runnable under Node.js and owns its required state.
3. The application consumes the Brain through the defined boundary without moving UI/platform/network responsibilities into it.
4. Existing speed/privacy/keep-awake and other relevant quality-gate contracts pass.
5. The full Frenano quality gate passes on the exact implementation commit.
6. iOS packaging and established reliable UI regression contracts remain green.
7. Diagnostics expose `speed_engine=1.0.0` without weakening privacy.
8. No intentional speed-algorithm improvement is present in the extraction diff.
9. `ios-prod` remains untouched.

Known simulator-only deep Settings accessibility/navigation limitations are not a reason to alter product behaviour and are not part of Speed Brain acceptance.

## Explicit non-goals for v1.0.0

- Better speed accuracy than today's proven engine
- New smoothing or prediction algorithms
- Road Brain extraction
- Transport Brain extraction
- generalized inter-Brain event architecture
- UI or Settings redesign
- Android/native-platform work
- changing speed thresholds because a different value appears preferable
- cleaning unrelated legacy code

## Follow-on work

After v1.0.0 is extracted, verified, reviewed and integrated separately, future Speed Brain releases can improve the algorithm deliberately. Recorded GPS sequences can then be replayed through multiple Brain versions to compare behaviour objectively before choosing an upgrade.

Road Brain and Transport Brain should receive their own design/specification cycles rather than being folded into this implementation.