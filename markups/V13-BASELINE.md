# Super Simple Speedo — v13.0.0 baseline

Baseline: v12.24.0 walking mode.

## New in v13.0.0

- Persistent diagnostics archive in IndexedDB.
- Full archive survives app restarts and retains up to 30 days of events on-device.
- Recent diagnostic buffer remains in localStorage for fast UI/copy behaviour.
- Download now exports the full archive rather than only the recent in-memory buffer.
- Optional ground-truth buttons (Walk / Bus / Car / Tram / Train) log the actual mode for later learning.
- Each app run receives a diagnostic session ID.
- Transport Detective now adds a Swiss public-transport timetable evidence layer using transport.opendata.ch.
- Nearby stops are queried from coordinates, then nearby scheduled services are scored using stop distance, timetable proximity, current movement-classifier evidence, and repeated service/station continuity.
- Fresh timetable evidence boosts the matching transport family rather than replacing the movement classifier outright.
- Transit candidates and lookup errors are recorded in diagnostics.
- Transport metrics show the best timetable candidate, destination, confidence and nearest matched stop when available.

## Privacy / networking

Transport Detective remains experimental and off by default. When enabled, it may send current coordinates to transport.opendata.ch to find nearby stops and timetable candidates. Diagnostic archives stay on the device unless the user explicitly exports them.

## Quality gate

Run:

    node check-regressions.js index.template.html <path-to-v12.24-index.template.html>

Expected result: 0 failures, 0 warnings.
