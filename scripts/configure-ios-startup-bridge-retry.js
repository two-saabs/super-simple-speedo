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

// The window/root controller is not guaranteed to exist during didFinishLaunching on
// modern scene-based iOS apps. Install the startup underlay as soon as either the
// AppDelegate window or the active UIWindowScene becomes available, retrying briefly
// while the native scene hierarchy is being created.
const bridgeBlockPattern = /\n\s*\/\/ FRENANO_WEBVIEW_BRIDGE_BEGIN[\s\S]*?\/\/ FRENANO_WEBVIEW_BRIDGE_END/g;
if (!bridgeBlockPattern.test(swift)) {
  console.error("iOS startup cleanup failed: generated startup bridge block was not found.");
  process.exit(1);
}

const replacement = `
        // FRENANO_WEBVIEW_BRIDGE_BEGIN
        let frenanoBlue = UIColor(red: 0.024, green: 0.094, blue: 0.165, alpha: 1.0)
        window?.backgroundColor = frenanoBlue

        func frenanoStartupWindow() -> UIWindow? {
            if let appWindow = self.window {
                return appWindow
            }
            if #available(iOS 13.0, *) {
                let sceneWindows = UIApplication.shared.connectedScenes
                    .compactMap { $0 as? UIWindowScene }
                    .flatMap { $0.windows }
                return sceneWindows.first(where: { $0.isKeyWindow }) ?? sceneWindows.first
            }
            return nil
        }

        func findFrenanoBridge(_ controller: UIViewController?) -> CAPBridgeViewController? {
            guard let controller = controller else { return nil }
            if let bridge = controller as? CAPBridgeViewController { return bridge }
            for child in controller.children {
                if let bridge = findFrenanoBridge(child) { return bridge }
            }
            if let presented = controller.presentedViewController {
                return findFrenanoBridge(presented)
            }
            return nil
        }

        func installFrenanoStartupUnderlay(attempt: Int) {
            guard let startupWindow = frenanoStartupWindow(),
                  let rootController = startupWindow.rootViewController else {
                if attempt == 0 {
                    print("[FRENANO_COLD_START] native_underlay_root_missing")
                }
                if attempt < 120 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        installFrenanoStartupUnderlay(attempt: attempt + 1)
                    }
                } else {
                    print("[FRENANO_COLD_START] native_underlay_root_timeout")
                }
                return
            }

            let rootView = rootController.view!
            startupWindow.backgroundColor = frenanoBlue
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
                    print("[FRENANO_COLD_START] native_underlay_image_ready attempt=\\(attempt)")
                } else {
                    print("[FRENANO_COLD_START] native_underlay_image_missing attempt=\\(attempt)")
                }

                rootView.insertSubview(underlay, at: 0)
                print("[FRENANO_COLD_START] native_underlay_ready attempt=\\(attempt)")
            }

            if let bridge = findFrenanoBridge(rootController) {
                bridge.view.backgroundColor = .clear
                bridge.webView?.isOpaque = false
                bridge.webView?.backgroundColor = .clear
                bridge.webView?.scrollView.backgroundColor = .clear
                print("[FRENANO_COLD_START] native_webview_transparent attempt=\\(attempt)")
            } else if attempt < 120 {
                if attempt == 0 {
                    print("[FRENANO_COLD_START] native_webview_bridge_unavailable")
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                    installFrenanoStartupUnderlay(attempt: attempt + 1)
                }
            } else {
                print("[FRENANO_COLD_START] native_webview_bridge_timeout")
            }
        }

        DispatchQueue.main.async {
            print("[FRENANO_COLD_START] native_webview_prepare")
            installFrenanoStartupUnderlay(attempt: 0)
        }
        // FRENANO_WEBVIEW_BRIDGE_END`;

swift = swift.replace(bridgeBlockPattern, replacement);
fs.writeFileSync(appDelegatePath, swift, "utf8");

const configured = fs.readFileSync(appDelegatePath, "utf8");
if (!configured.includes("installFrenanoStartupUnderlay") || !configured.includes("frenanoStartupWindow")) {
  console.error("iOS startup cleanup failed: scene-aware startup underlay was not installed.");
  process.exit(1);
}
if (!configured.includes("native_underlay_image_ready") || !configured.includes("native_webview_prepare")) {
  console.error("iOS startup cleanup failed: startup underlay diagnostics are missing.");
  process.exit(1);
}

console.log("Installed scene-aware native startup underlay with bounded retry and transparent WebView handoff.");
