const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDelegatePath = path.join(rootDir, "ios", "App", "App", "AppDelegate.swift");

if (!fs.existsSync(appDelegatePath)) {
  console.error("iOS startup cleanup failed: AppDelegate.swift was not found.");
  process.exit(1);
}

let swift = fs.readFileSync(appDelegatePath, "utf8");

// configure-ios.js still emits the historical bridge block so older generated
// AppDelegate files remain compatible. Strip that experiment after each sync.
const bridgeBlockPattern = /\n\s*\/\/ FRENANO_WEBVIEW_BRIDGE_BEGIN[\s\S]*?\/\/ FRENANO_WEBVIEW_BRIDGE_END\s*\n/g;
swift = swift.replace(bridgeBlockPattern, "\n");

fs.writeFileSync(appDelegatePath, swift, "utf8");

const configured = fs.readFileSync(appDelegatePath, "utf8");
if (configured.includes("FRENANO_WEBVIEW_BRIDGE_BEGIN") || configured.includes("native_bridge_wait") || configured.includes("native_bridge_timeout")) {
  console.error("iOS startup cleanup failed: experimental bridge polling is still present.");
  process.exit(1);
}
if (!configured.includes("[FRENANO_COLD_START] native_app_launch")) {
  console.error("iOS startup cleanup failed: native cold-start timing marker is missing.");
  process.exit(1);
}

console.log("Removed experimental iOS bridge polling; retained cold-start timing only.");
