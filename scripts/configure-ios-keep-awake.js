const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDelegatePath = path.join(rootDir, "ios", "App", "App", "AppDelegate.swift");

if (!fs.existsSync(appDelegatePath)) {
  console.error("iOS keep-awake configuration failed: ios/App/App/AppDelegate.swift was not found. Run `npx cap add ios` first.");
  process.exit(1);
}

let swift = fs.readFileSync(appDelegatePath, "utf8");
const marker = "Frenano: keep the display awake while the app is active";

if (!swift.includes(marker)) {
  const classEnd = swift.lastIndexOf("\n}");
  if (classEnd === -1) {
    console.error("iOS keep-awake configuration failed: AppDelegate class ending could not be found.");
    process.exit(1);
  }

  const keepAwakeMethod = `

    // Frenano: keep the display awake while the app is active.
    // The web Wake Lock API is not reliable inside the iOS Capacitor WebView,
    // so enforce the equivalent native iOS behaviour and re-apply it whenever
    // the app returns to the foreground.
    func applicationDidBecomeActive(_ application: UIApplication) {
        application.isIdleTimerDisabled = true
    }
`;

  swift = swift.slice(0, classEnd) + keepAwakeMethod + swift.slice(classEnd);
  fs.writeFileSync(appDelegatePath, swift, "utf8");
}

if (!fs.readFileSync(appDelegatePath, "utf8").includes("application.isIdleTimerDisabled = true")) {
  console.error("iOS keep-awake configuration failed: native idle timer override was not installed.");
  process.exit(1);
}

console.log("Configured native iOS keep-awake behaviour.");
