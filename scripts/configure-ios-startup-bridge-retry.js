const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDelegatePath = path.join(rootDir, "ios", "App", "App", "AppDelegate.swift");

if (!fs.existsSync(appDelegatePath)) {
  console.error("iOS startup bridge configuration failed: AppDelegate.swift was not found.");
  process.exit(1);
}

let swift = fs.readFileSync(appDelegatePath, "utf8");

const blockPattern = /        \/\/ FRENANO_WEBVIEW_BRIDGE_BEGIN[\s\S]*?        \/\/ FRENANO_WEBVIEW_BRIDGE_END/;
if (!blockPattern.test(swift)) {
  console.error("iOS startup bridge configuration failed: Frenano bridge marker block was not found.");
  process.exit(1);
}

const replacement = `        // FRENANO_WEBVIEW_BRIDGE_BEGIN
        let frenanoBlue = UIColor(red: 0.024, green: 0.094, blue: 0.165, alpha: 1.0)
        window?.backgroundColor = frenanoBlue

        func makeFrenanoStartupView(frame: CGRect, tag: Int) -> UIView {
            let startup = UIView(frame: frame)
            startup.tag = tag
            startup.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            startup.backgroundColor = frenanoBlue

            if let bgImage = UIImage(named: "FrenanoLaunchBackground") {
                let bg = UIImageView(frame: startup.bounds)
                bg.image = bgImage
                bg.contentMode = .scaleAspectFill
                bg.clipsToBounds = true
                bg.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                startup.addSubview(bg)
            }

            let shade = UIView(frame: startup.bounds)
            shade.backgroundColor = UIColor(red: 0.015, green: 0.071, blue: 0.125, alpha: 0.72)
            shade.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            startup.addSubview(shade)

            let spinner = UIActivityIndicatorView(style: .medium)
            spinner.color = UIColor.white.withAlphaComponent(0.72)
            spinner.translatesAutoresizingMaskIntoConstraints = false
            spinner.startAnimating()
            startup.addSubview(spinner)

            let message = UILabel()
            message.text = "Setting you up…"
            message.textColor = UIColor.white.withAlphaComponent(0.82)
            message.font = .systemFont(ofSize: 18, weight: .semibold)
            message.textAlignment = .center
            message.translatesAutoresizingMaskIntoConstraints = false
            startup.addSubview(message)

            NSLayoutConstraint.activate([
                spinner.centerXAnchor.constraint(equalTo: startup.centerXAnchor),
                spinner.centerYAnchor.constraint(equalTo: startup.centerYAnchor, constant: -22),
                message.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 14),
                message.centerXAnchor.constraint(equalTo: startup.centerXAnchor)
            ])

            return startup
        }

        func findFrenanoBridge(_ controller: UIViewController?) -> CAPBridgeViewController? {
            guard let controller = controller else { return nil }
            if let bridge = controller as? CAPBridgeViewController { return bridge }

            if let presented = controller.presentedViewController,
               let bridge = findFrenanoBridge(presented) {
                return bridge
            }

            if let navigation = controller as? UINavigationController,
               let bridge = findFrenanoBridge(navigation.visibleViewController) {
                return bridge
            }

            if let tab = controller as? UITabBarController,
               let bridge = findFrenanoBridge(tab.selectedViewController) {
                return bridge
            }

            for child in controller.children {
                if let bridge = findFrenanoBridge(child) { return bridge }
            }

            return nil
        }

        // Put the Frenano setup view directly on the native window immediately.
        // This bridges the period before Capacitor has even created its bridge controller.
        if let launchWindow = window, launchWindow.viewWithTag(734900) == nil {
            let launchCover = makeFrenanoStartupView(frame: launchWindow.bounds, tag: 734900)
            launchWindow.addSubview(launchCover)
            let coverReadyMs = Int(Date().timeIntervalSince1970 * 1000)
            print("[FRENANO_COLD_START] native_window_cover_ready epoch_ms=\\(coverReadyMs)")
        }

        let bridgeRetryStartedAt = Date()
        let bridgeRetryTimeout: TimeInterval = 12.0

        func attachFrenanoUnderlay(attempt: Int) {
            let attemptMs = Int(Date().timeIntervalSince1970 * 1000)
            if attempt == 0 {
                print("[FRENANO_COLD_START] native_bridge_dispatch epoch_ms=\\(attemptMs)")
                if let root = self.window?.rootViewController {
                    print("[FRENANO_COLD_START] native_root_controller class=\\(String(describing: type(of: root)))")
                } else {
                    print("[FRENANO_COLD_START] native_root_controller class=nil")
                }
            }

            guard let bridge = findFrenanoBridge(self.window?.rootViewController) else {
                let elapsed = Date().timeIntervalSince(bridgeRetryStartedAt)
                if elapsed < bridgeRetryTimeout {
                    if attempt == 0 || attempt % 20 == 0 {
                        print("[FRENANO_COLD_START] native_bridge_wait attempt=\\(attempt) elapsed_ms=\\(Int(elapsed * 1000))")
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        attachFrenanoUnderlay(attempt: attempt + 1)
                    }
                } else {
                    let timeoutMs = Int(Date().timeIntervalSince1970 * 1000)
                    print("[FRENANO_COLD_START] native_bridge_timeout epoch_ms=\\(timeoutMs) attempts=\\(attempt)")
                }
                return
            }

            let bridgeReadyMs = Int(Date().timeIntervalSince1970 * 1000)
            print("[FRENANO_COLD_START] native_bridge_ready epoch_ms=\\(bridgeReadyMs) attempts=\\(attempt)")

            bridge.view.backgroundColor = frenanoBlue
            bridge.webView?.isOpaque = false
            bridge.webView?.backgroundColor = .clear
            bridge.webView?.scrollView.backgroundColor = .clear

            if bridge.view.viewWithTag(734901) == nil {
                let underlay = makeFrenanoStartupView(frame: bridge.view.bounds, tag: 734901)
                bridge.view.insertSubview(underlay, at: 0)
            }

            // Transfer seamlessly from the window-level cover to the WebView underlay.
            self.window?.viewWithTag(734900)?.removeFromSuperview()

            let underlayReadyMs = Int(Date().timeIntervalSince1970 * 1000)
            print("[FRENANO_COLD_START] native_underlay_ready epoch_ms=\\(underlayReadyMs)")
        }

        DispatchQueue.main.async {
            attachFrenanoUnderlay(attempt: 0)
        }
        // FRENANO_WEBVIEW_BRIDGE_END`;

swift = swift.replace(blockPattern, replacement);
fs.writeFileSync(appDelegatePath, swift, "utf8");

const configured = fs.readFileSync(appDelegatePath, "utf8");
if (!configured.includes("findFrenanoBridge") || !configured.includes("native_root_controller") || !configured.includes("native_bridge_ready")) {
  console.error("iOS startup bridge configuration failed: recursive bridge discovery was not installed correctly.");
  process.exit(1);
}

console.log("Configured recursive iOS Capacitor bridge discovery and startup cover.");
