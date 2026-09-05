# Super Simple Speedo — iOS v1.0 release configuration

This file records the agreed release identity and the values to use when creating the Xcode/App Store project.

## App identity

- App name: **Super Simple Speedo**
- Marketing version: **1.0.0**
- Initial build number: **1**
- Bundle ID: **app.supersimplespeedo.ios**
- Production web endpoint: **https://supersimplespeedo.app**
- Experimental branch/site: **not included in the App Store build**

## Release behaviour

- Stable App Store build only.
- Experimental Journey / Transport Detective UI must remain hidden and inactive.
- Swiss public-transport API calls must remain blocked in the stable build.
- Privacy-safe **Help & Diagnostics** is included in v1.0.
- Diagnostic sharing is user initiated only; nothing is uploaded automatically.

## Location permission copy

Recommended iOS purpose string:

> Super Simple Speedo uses your location to calculate your current speed and look up the road's speed limit.

Keep the wording short and functional. No background-location claim should be added unless the native implementation genuinely requires and uses background location.

## Permissions / capabilities principle

Request the minimum needed for v1.0. Expected requirement: foreground location while using the app. Do not enable unrelated capabilities merely because Xcode offers them.

## Native packaging checklist

- Create Xcode project / iOS shell.
- Set Bundle ID to `app.supersimplespeedo.ios`.
- Set app name to `Super Simple Speedo`.
- Set marketing version to `1.0.0` and build `1`.
- Select the Apple Developer team and enable automatic signing where appropriate.
- Add the location purpose string above.
- Load/package the stable production experience only.
- Ensure Help & Diagnostics can invoke the iOS share sheet.
- Wire foreground/background lifecycle safely.
- Verify screen/wake behaviour on a real device.
- Add final App Store icon assets and launch screen.
- Review capabilities before archive: keep only those actually required.

## Evening hands-on checkpoint

The next focused session should end with the first locally signed build installed on a real iPhone and opening as **Super Simple Speedo 1.0.0 (1)**.
