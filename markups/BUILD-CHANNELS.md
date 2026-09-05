# Build/channel contract

Super Simple Speedo has one shared application foundation and two independent axes: release channel and platform.

| Target | Shared fixes | Experimental features | Visible marker | Native iOS adaptations |
|---|---|---|---|---|
| main | yes | no | none | no |
| test | yes | no | orange TEST VERSION + version/build time | no |
| experimental | yes | yes | blue EXPERIMENTAL MODE + version/build time | no |
| App Store iOS | yes | no | none | yes |

Rules:
- Ordinary layout, speed logic, road logic, privacy and diagnostics fixes belong in the shared foundation.
- Test must differ from main only by test identity/build metadata.
- Experimental may add experimental behaviour/UI, but must inherit shared fixes.
- iOS may adapt permissions, lifecycle, secure API routing and native shell behaviour, but must not fork ordinary web layout.
- Safe-area geometry has one owner: shared CSS. Capacitor uses `contentInset: never` so WKWebView does not independently offset the same content.
- Test/experimental build markers are build-time metadata and reserve their own portrait band; they must not redefine the shared header itself.
