const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDelegatePath = path.join(rootDir, "ios", "App", "App", "AppDelegate.swift");

if (!fs.existsSync(appDelegatePath)) {
  console.error("iOS keep-awake configuration failed: ios/App/App/AppDelegate.swift was not found. Run `npx cap add ios` first.");
  process.exit(1);
}

let swift = fs.readFileSync(appDelegatePath, "utf8");
const launchMarker = "Frenano: disable the iOS idle timer immediately at launch";
const activeMarker = "Frenano: keep the display awake while the app is active";

// Set the native idle-timer override as early as possible. Capacitor 8 uses the
// modern iOS scene lifecycle, so relying only on applicationDidBecomeActive is
// not sufficient on every launch/lifecycle path.
if (!swift.includes(launchMarker)) {
  const didFinishPattern = /(func application\(\s*_ application: UIApplication,\s*didFinishLaunchingWithOptions[\s\S]*?\) -> Bool \{)/;
  const match = swift.match(didFinishPattern);
  if (!match) {
    console.error("iOS keep-awake configuration failed: didFinishLaunchingWithOptions could not be found in AppDelegate.swift.");
    process.exit(1);
  }

  const injection = `${match[1]}\n        // Frenano: disable the iOS idle timer immediately at launch.\n        application.isIdleTimerDisabled = true`;
  swift = swift.replace(match[1], injection);
}

// Older versions of this script appended a complete applicationDidBecomeActive
// callback. If AppDelegate already had that callback, Xcode correctly reported
// an invalid redeclaration. Remove only that exact generated block so this sync
// repairs checkouts that were already touched by the old script.
const legacyGeneratedActiveMethod = /\n\n    \/\/ Frenano: keep the display awake while the app is active\.\n    \/\/ The web Wake Lock API is not reliable inside the iOS Capacitor WebView,\n    \/\/ so enforce the equivalent native iOS behaviour and re-apply it whenever\n    \/\/ this AppDelegate lifecycle callback fires\.\n    func applicationDidBecomeActive\(_ application: UIApplication\) \{\n        application\.isIdleTimerDisabled = true\n    \}\n/;
if (legacyGeneratedActiveMethod.test(swift)) {
  swift = swift.replace(legacyGeneratedActiveMethod, "");
}

// Re-assert the setting whenever this AppDelegate lifecycle callback is used.
// Prefer injecting into the callback Capacitor/Xcode already provides. Only add
// a callback if the file genuinely has none, making repeated syncs idempotent.
if (!swift.includes(activeMarker)) {
  const existingActivePattern = /(func applicationDidBecomeActive\(_ application: UIApplication\) \{)/;
  const existingActive = swift.match(existingActivePattern);

  if (existingActive) {
    const injection = `${existingActive[1]}\n        // Frenano: keep the display awake while the app is active.\n        application.isIdleTimerDisabled = true`;
    swift = swift.replace(existingActive[1], injection);
  } else {
    const classEnd = swift.lastIndexOf("\n}");
    if (classEnd === -1) {
      console.error("iOS keep-awake configuration failed: AppDelegate class ending could not be found.");
      process.exit(1);
    }

    const keepAwakeMethod = `

    // Frenano: keep the display awake while the app is active.
    func applicationDidBecomeActive(_ application: UIApplication) {
        application.isIdleTimerDisabled = true
    }
`;

    swift = swift.slice(0, classEnd) + keepAwakeMethod + swift.slice(classEnd);
  }
}

fs.writeFileSync(appDelegatePath, swift, "utf8");

const configuredSwift = fs.readFileSync(appDelegatePath, "utf8");
const idleTimerAssignments = (configuredSwift.match(/application\.isIdleTimerDisabled = true/g) || []).length;
const activeMethodCount = (configuredSwift.match(/func applicationDidBecomeActive\(_ application: UIApplication\)/g) || []).length;
if (!configuredSwift.includes(launchMarker) || !configuredSwift.includes(activeMarker) || idleTimerAssignments < 2 || activeMethodCount !== 1) {
  console.error("iOS keep-awake configuration failed: native idle timer override was not installed cleanly.");
  process.exit(1);
}

console.log("Configured native iOS keep-awake behaviour at launch and on app activation.");
