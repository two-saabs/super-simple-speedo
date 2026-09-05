# Super Simple Speedo — App Store v1.0 bootstrap

This branch starts exactly from stable Super Simple Speedo **13.4.3** (`fba4c61334fb408247e46ee6cdf8d74495429a08`).

The existing stable build remains authoritative. The iOS target packages its generated `dist/` output in Capacitor; it does not enable experimental Journey or Transport Detective features.

## First Mac setup

```bash
git clone https://github.com/two-saabs/super-simple-speedo.git
cd super-simple-speedo
git switch appstore-v1.0
npm install
export GEOAPIFY_API_KEY='YOUR_EXISTING_KEY'
npm run ios:init
npm run ios:open
```

`ios:init` performs the stable web build, prepares the iOS-specific packaged output, creates the Capacitor iOS project, synchronises the web bundle, and adds the foreground-location purpose string to `Info.plist`.

After Xcode opens:

1. Select the `App` target.
2. Choose the correct Apple Developer Team under Signing & Capabilities.
3. Confirm bundle identifier `app.supersimplespeedo.ios`.
4. Set Version `1.0.0` and Build `1` if Xcode has not inherited those values yet.
5. Connect/select the real iPhone as the run destination.
6. Press Run.
7. Confirm the app opens as **Super Simple Speedo**, asks for location while in use, and reaches the live speedometer.

## Subsequent web-code syncs

```bash
export GEOAPIFY_API_KEY='YOUR_EXISTING_KEY'
npm run ios:sync
npm run ios:open
```

## Release guardrails

- Stable build only.
- No Journey / Transport Detective UI in App Store v1.0.
- No `transport.opendata.ch` calls in stable builds.
- Foreground location only for v1.0.
- PWA service-worker registration and browser install UI are suppressed inside the native shell.
- Do not merge experimental functionality into this branch merely to prepare the App Store release.
