# Super Simple Speedo deployment strategy

## Branches

- `main` is the stable release branch and the source for production / App Store work.
- `experimental` contains Journey, Transport Detective and other work-in-progress features.
- Pull requests provide temporary Netlify deploy previews for testing before merge.

## Netlify

- Production: `main` → `https://supersimplespeedo.app`
- Experimental branch deploy: `experimental` → `https://experimental--super-simple-speedo.netlify.app`
- PRs against configured deploy branches use Netlify Deploy Previews.

## Build profiles

Each branch contains `build-profile.json`.

Stable builds set `experimentalFeatures` to `false`. The build then:

- hides the Experimental settings section;
- forces Journey and Transport Detective state off;
- clears stale experimental local-storage state;
- forces the stable visual theme;
- blocks requests to `transport.opendata.ch` as a defence-in-depth privacy guard.

Experimental builds set `experimentalFeatures` to `true` and show `· Experimental` beside the version in About.

## Release rule

Stable fixes should normally land on `main` and then be merged/cherry-picked into `experimental`. Experimental functionality must not be merged to `main` simply to prepare an App Store release.
