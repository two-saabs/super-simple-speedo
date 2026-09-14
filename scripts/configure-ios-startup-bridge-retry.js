const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDelegatePath = path.join(rootDir, "ios", "App", "App", "AppDelegate.swift");

if (!fs.existsSync(appDelegatePath)) {
  console.error("iOS startup cleanup failed: AppDelegate.swift was not found.");
  process.exit(1);
}

let swift = fs.readFileSync(appDelegatePath, "utf8");

if (!swift.includes("[FRENANO_COLD_START] native_app_launch")) {
  console.error("iOS startup cleanup failed: native cold-start timing marker is missing.");
  process.exit(1);
}

// Replace the old asynchronous bridge-dependent underlay with a root-view underlay that
// is installed synchronously during didFinishLaunching. This removes the timing race that
// left a black screen while WebKit spent several seconds starting up.
const bridgeBlockPattern = /\n\s*\/\/ FRENANO_WEBVIEW_BRIDGE_BEGIN[\s\S]*?\/\/ FRENANO_WEBVIEW_BRIDGE_END/g;
if (!bridgeBlockPattern.test(swift)) {
  console.error("iOS startup cleanup failed: generated startup bridge block was not found.");
  process.exit(1);
}

const replacement = `
        // FRENANO_WEBVIEW_BRIDGE_BEGIN
        let frenanoBlue = UIColor(red: 0.024, green: 0.094, blue: 0.165, alpha: 1.0)
        window?.backgroundColor = frenanoBlue

        if let rootView = window?.rootViewController?.view {
            rootView.backgroundColor = frenanoBlue

            if rootView.viewWithTag(734901) == nil {
                let underlay = UIView(frame: rootView.bounds)
                underlay.tag = 734901
                underlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                underlay.backgroundColor = frenanoBlue

                if let bgImage = UIImage(named: "Splash") {
                    let bg = UIImageView(frame: underlay.bounds)
                    bg.image = bgImage
                    bg.contentMode = .scaleAspectFill
                    bg.clipsToBounds = true
                    bg.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                    underlay.addSubview(bg)
                    print("[FRENANO_COLD_START] native_underlay_image_ready")
                } else {
                    print("[FRENANO_COLD_START] native_underlay_image_missing")
                }

                rootView.insertSubview(underlay, at: 0)
                print("[FRENANO_COLD_START] native_underlay_ready")
            }
        } else {
            print("[FRENANO_COLD_START] native_underlay_root_missing")
        }

        // Make the Capacitor WebView transparent as soon as it exists so the native road
        // image remains visible until the first web frame paints over it.
        DispatchQueue.main.async { [weak self] in
            print("[FRENANO_COLD_START] native_webview_prepare")
            if let bridge = self?.window?.rootViewController as? CAPBridgeViewController {
                bridge.view.backgroundColor = .clear
                bridge.webView?.isOpaque = false
                bridge.webView?.backgroundColor = .clear
                bridge.webView?.scrollView.backgroundColor = .clear
                print("[FRENANO_COLD_START] native_webview_transparent")
            } else {
                print("[FRENANO_COLD_START] native_webview_bridge_unavailable")
            }
        }
        // FRENANO_WEBVIEW_BRIDGE_END`;

swift = swift.replace(bridgeBlockPattern, replacement);
fs.writeFileSync(appDelegatePath, swift, "utf8");

const configured = fs.readFileSync(appDelegatePath, "utf8");
if (configured.includes("native_bridge_wait") || configured.includes("native_bridge_timeout")) {
  console.error("iOS startup cleanup failed: experimental bridge polling is still present.");
  process.exit(1);
}
if (!configured.includes("native_underlay_image_ready") || !configured.includes("native_webview_prepare")) {
  console.error("iOS startup cleanup failed: synchronous startup underlay was not installed.");
  process.exit(1);
}

console.log("Installed synchronous native startup underlay and transparent WebView handoff.");
