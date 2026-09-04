# Super Simple Speedo deployment strategy

## Branches and destinations

- `main` is the stable web-app branch. It must build with channel `stable` and is the source shown at `https://supersimplespeedo.app/web` (and any `/webapp` alias).
- `test` is the test branch. It must build with channel `test` and deploy only to the Test Netlify branch URL.
- `experimental` is the experimental branch. It must build with channel `experimental` and deploy only to the Experimental Netlify branch URL.
- `appstore-v1.0` is the native iOS/App Store packaging branch. It must build with channel `stable`; it is not a public web deployment and exists behind the scenes for Xcode/TestFlight/App Store builds.
- Pull requests may use temporary Netlify deploy previews for testing before merge.

## Netlify

- Stable web app: `main` → `https://supersimplespeedo.app/web`
- Test branch deploy: `test` → Test Netlify branch URL
- Experimental branch deploy: `experimental` → `https://experimental--super-simple-speedo.netlify.app`
- Product/marketing homepage remains at `https://supersimplespeedo.app/` and should link to the stable web app rather than a test or experimental build.

## Build profiles

Every deployable branch contains `build-profile.json`. These profiles are part of the deployment contract and must not be copied blindly between branches:

- `main`: `channel=stable`, `experimentalFeatures=false`
- `test`: `channel=test`, `experimentalFeatures=false`
- `experimental`: `channel=experimental`, `experimentalFeatures=true`
- `appstore-v1.0`: `channel=stable`, `experimentalFeatures=false`

Stable builds show no TEST/EXPERIMENTAL banner. Test builds show `TEST VERSION`. Experimental builds show `EXPERIMENTAL VERSION` and enable the experimental feature set.

## Stable behaviour

The stable profile is the production equivalent of `EXPERIMENTAL_FEATURES=false`. The build then:

- hides the Experimental settings section;
- forces Journey and Transport Detective state off;
- clears stale experimental local-storage state;
- forces the stable visual theme;
- blocks requests to `transport.opendata.ch` as a defence-in-depth privacy guard.

## Release rule

Stable fixes should normally land on `main` and then be merged/cherry-picked into `test`, `experimental`, and the iOS packaging branch as appropriate. Branch-specific `build-profile.json` files must retain their own channel identity when code is promoted between branches.
