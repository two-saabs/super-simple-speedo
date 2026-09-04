# Super Simple Speedo deployment strategy

## Branches

- `main` is the stable web release branch.
- `test` is the test web branch.
- `experimental` is the experimental web branch.
- `website-product-home` serves the public product site and `/web` stable app entry point.
- `appstore-v1.0` contains the native iOS/App Store packaging workflow.

## Netlify / app destinations

- Stable web app: `main` / product-site `/web` → `https://supersimplespeedo.app/web`
- Test: `test` → test Netlify branch deployment
- Experimental: `experimental` → experimental Netlify branch deployment
- iOS: `appstore-v1.0` → native build / TestFlight / App Store only

## Build profiles

Each app branch contains `build-profile.json` and must keep its own channel identity:

- `main`: `stable`
- `test`: `test`
- `experimental`: `experimental`
- `appstore-v1.0`: `stable` native package

Do not copy `build-profile.json` between branches during promotion.

## Icon source of truth

The approved Speedo app icon is stored as complete PNG files under `icons/` and as the UI vector under `brand/speedo-mark.svg`.

- `icons/icon-192.png` — PWA / Apple touch icon
- `icons/icon-512.png` — PWA large icon
- `icons/icon-1024.png` — native iOS/App Store source icon

All app channels should use the same approved artwork. Do not create placeholder `S` icons.

## Release rule

Stable fixes should normally land on `main`, then be promoted deliberately to `test`, `experimental`, and `appstore-v1.0` as appropriate. Experimental functionality must not be merged into stable simply to prepare a release.
