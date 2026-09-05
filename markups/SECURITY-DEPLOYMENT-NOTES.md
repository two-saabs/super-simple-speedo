# Super Simple Speedo — production security update

Release: **Build v1.10.13**

## Upload these files

Place these files at the site root:

- `index.template.html` — updated application template
- `service-worker.js` — versioned, privacy-safe PWA cache
- `_headers` — Netlify security and cache headers

Keep the existing `manifest.webmanifest` and `/icons/` directory.

The deployment process must continue replacing `__GEOAPIFY_API_KEY__` in `index.template.html` when producing the live `index.html`. Do not manually commit a private server credential. A browser Geoapify key remains visible by design and must be restricted in Geoapify.

## Geoapify console checks

Restrict the browser key to these production origins:

- `https://supersimplespeedo.app`
- `https://www.supersimplespeedo.app`

Remove old Netlify preview or development origins unless still required. Restrict the key to the reverse-geocoding and map-matching APIs, set a practical quota, and enable usage alerts where available.

## Changes included

- Defensive parsing and validation of local settings and statistics
- Separate stability histories for speed limits and road names
- A changed road requires two matching results before confirmation
- The last confirmed road remains visible while a neighbouring candidate is checked
- Diagnostics warn that copied logs can contain precise location history
- Privacy wording clarifies Geoapify location use and no behavioural tracking
- Service-worker identifier updated to `v1.10.13`
- Geoapify responses and cross-origin requests are never service-worker cached
- Network-first HTML caching reduces stale-release problems
- Netlify CSP, HSTS, clickjacking, MIME-sniffing, referrer and permissions protections

## Post-deployment checks

1. Open the app in a private browser window and confirm it loads.
2. Connect GPS and confirm the browser asks for geolocation permission.
3. Confirm automatic matching can call Geoapify; a CSP error in the browser console would indicate a header typo.
4. Open Settings → About and confirm `Build v1.10.13`.
5. Open Settings → GPS diagnostics and confirm the privacy warning is visible.
6. Reload once, then test airplane mode to verify the cached app shell opens.
7. Verify an old installed PWA updates after closing and reopening it.

## Deliberate CSP compromise

The current application keeps CSS and JavaScript inline, so the Content Security Policy temporarily permits `'unsafe-inline'`. Moving them into separate files later would allow a stronger CSP without that exception.
