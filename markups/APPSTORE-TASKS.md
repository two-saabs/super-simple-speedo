# Super Simple Speedo — App Store v1.0 task list

Updated: 2026-08-29

## Current estimate

- Overall launch readiness: **72% complete**
- Remaining work: **28%**
- Engineering readiness: **about 88% complete**

The remaining percentage is weighted toward release/admin steps rather than core speedometer engineering.

## Done

- [x] Freeze App Store v1.0 on stable 13.4.3 baseline
- [x] Keep experimental Journey / public-transport features out of stable App Store build
- [x] Capacitor iOS shell created and running on a real iPhone
- [x] Bundle/app identity and foreground location permission configured
- [x] Native GPS delivery verified on device
- [x] Speed display, native GPS and position-derived fallback verified
- [x] Driver UI thresholds/state changes verified
- [x] Geoapify road lookup verified
- [x] Foreground/background lifecycle instrumented
- [x] Confirm app intentionally stops location watch when hidden and resumes on foreground
- [x] Sanitised Help & Diagnostics sharing added
- [x] iOS portrait/landscape safe-area jump fixed
- [x] iOS transient visual-viewport zoom isolated from app sizing
- [x] Diagnostic archive null-warning path hardened
- [x] Latest stable quality gate passes after viewport/archive fix

## Remaining before App Store submission

- [ ] Final real-world regression drive/walk/public-transport test on the latest stable iOS build
- [ ] Specifically test foreground reacquisition after minimising/reopening mid-journey
- [ ] Final portrait → landscape → portrait and minimise/reopen smoke test after a clean rebuild
- [ ] Confirm latest Xcode build has no new meaningful warnings/errors
- [ ] Confirm final App Store icon and launch-screen presentation on device
- [ ] Review Xcode Signing & Capabilities and keep only required capabilities
- [ ] Create release Archive in Xcode and validate it
- [ ] Upload build to App Store Connect / TestFlight
- [ ] Run a TestFlight smoke test on the uploaded build
- [ ] Prepare App Store screenshots
- [ ] Complete App Store description, keywords, category, support/privacy URLs and other metadata
- [ ] Complete App Privacy answers consistently with actual v1.0 data use
- [ ] Final review of location-purpose wording and privacy/support text
- [ ] Submit v1.0 for App Review
- [ ] Address any App Review feedback if required

## Not blockers for v1.0

- Background journey tracking
- Zürich Edition / Transport Detective / Journey experimental work
- Further transport-identification accuracy tuning
- Camera road-sign detection
- Additional themes/dials
- Usage/community/train-nerd extensions

## Release rule

Do not add new product features to App Store v1.0 unless they fix a release blocker. From this point, prefer testing, polish, metadata and submission over feature work.
