# Frenano — iOS v1.0 release configuration

This file records the agreed release identity and the values to use when creating the Xcode/App Store project.

## App identity

- App name: **Frenano**
- Marketing version: **1.0**
- Bundle ID: **app.supersimplespeedo.ios** — deliberately retained so this remains the existing App Store app rather than a new app identity.
- Production web endpoint: **https://frenano.app**
- Stable web app: **https://frenano.app/app/**
- Experimental features: **not included in the App Store build**

## Release behaviour

- Stable App Store build only.
- Experimental Journey / Transport Detective UI remains hidden and inactive.
- Swiss public-transport API calls remain blocked in the stable build.
- Privacy-safe **Help & Diagnostics** is included.
- Diagnostic sharing is user initiated only; nothing is uploaded automatically.
- Geoapify access uses the secure Frenano server proxy; the API key must not be packaged in iOS.

## Location permission copy

> Frenano uses your location while you use the app to calculate your current speed and look up the road's speed limit.

Request the minimum capability needed: foreground/while-in-use location. Do not add a background-location claim unless the native implementation genuinely changes to require it.

## Native packaging checklist

- Keep Bundle ID `app.supersimplespeedo.ios`.
- Display name **Frenano**.
- Build the stable Frenano web app from `/app/`, not the marketing homepage.
- Use `images/frenano-app-icon-1024.png` as the canonical native icon source.
- Use the Frenano startup and running branding supplied by the stable web build.
- Privacy and support links point to `frenano.app` / `support@frenano.app`.
- Ensure Help & Diagnostics invokes the iOS share sheet.
- Verify native location permission status and the Manage in iPhone Settings control.
- Verify screen/wake behaviour and portrait/landscape layout on a real device.
- Confirm no Geoapify API key is present in the packaged HTML.
- Review capabilities before archive and keep only those actually required.

## Upgrade checkpoint

Install the Frenano build over the existing Super Simple Speedo build on a real iPhone. Confirm the app upgrades in place, existing settings remain available, the new icon/name appear correctly, and core speed/road lookup still functions before uploading to TestFlight.
