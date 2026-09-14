const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDelegatePath = path.join(rootDir, "ios", "App", "App", "AppDelegate.swift");

if (!fs.existsSync(appDelegatePath)) {
  console.error("iOS startup cleanup failed: AppDelegate.swift was not found.");
  process.exit(1);
}

const configured = fs.readFileSync(appDelegatePath, "utf8");

// Keep the simple native WebView underlay installed by configure-ios.js. It provides
// the startup-background safety net during the several-second gap between native app
// launch and the first web frame. Only reject the older polling experiment.
if (configured.includes("native_bridge_wait") || configured.includes("native_bridge_timeout")) {
  console.error("iOS startup cleanup failed: experimental bridge polling is still present.");
  process.exit(1);
}
if (!configured.includes("FRENANO_WEBVIEW_BRIDGE_BEGIN") || !configured.includes("FRENANO_WEBVIEW_BRIDGE_END")) {
  console.error("iOS startup cleanup failed: native startup underlay is missing.");
  process.exit(1);
}
if (!configured.includes("[FRENANO_COLD_START] native_app_launch")) {
  console.error("iOS startup cleanup failed: native cold-start timing marker is missing.");
  process.exit(1);
}

console.log("Retained simple iOS startup underlay; confirmed experimental bridge polling is absent.");
