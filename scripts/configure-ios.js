const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const iosAppDir = path.join(rootDir, "ios", "App", "App");
const infoPlist = path.join(iosAppDir, "Info.plist");

if (!fs.existsSync(infoPlist)) {
  console.error("iOS configuration failed: ios/App/App/Info.plist was not found. Run `npx cap add ios` first.");
  process.exit(1);
}

let plist = fs.readFileSync(infoPlist, "utf8");

function setOrInsertPlistString(key, value) {
  const keyToken = `<key>${key}</key>`;
  const keyIndex = plist.indexOf(keyToken);
  if (keyIndex !== -1) {
    const stringStart = plist.indexOf("<string>", keyIndex);
    const stringEnd = plist.indexOf("</string>", stringStart);
    if (stringStart !== -1 && stringEnd !== -1) {
      plist = plist.slice(0, stringStart) + `<string>${value}</string>` + plist.slice(stringEnd + 9);
      return;
    }
  }
  const insertion = `\n\t<key>${key}</key>\n\t<string>${value}</string>\n`;
  const rootClose = plist.lastIndexOf("</dict>");
  if (rootClose === -1) throw new Error("Info.plist root dictionary could not be found");
  plist = plist.slice(0, rootClose) + insertion + plist.slice(rootClose);
}

setOrInsertPlistString("CFBundleDisplayName", "Frenano");
const locationCopy = "Frenano uses your location while you use the app to calculate your current speed and look up the road's speed limit.";
setOrInsertPlistString("NSLocationWhenInUseUsageDescription", locationCopy);
setOrInsertPlistString("NSLocationAlwaysAndWhenInUseUsageDescription", locationCopy);
fs.writeFileSync(infoPlist, plist, "utf8");
console.log("Configured Frenano display name and iOS location purpose strings.");

const privacyManifest = path.join(iosAppDir, "PrivacyInfo.xcprivacy");
const privacyManifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>NSPrivacyTracking</key><false/>
<key>NSPrivacyTrackingDomains</key><array/>
<key>NSPrivacyCollectedDataTypes</key><array><dict>
<key>NSPrivacyCollectedDataType</key><string>NSPrivacyCollectedDataTypePreciseLocation</string>
<key>NSPrivacyCollectedDataTypeLinked</key><false/>
<key>NSPrivacyCollectedDataTypeTracking</key><false/>
<key>NSPrivacyCollectedDataTypePurposes</key><array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
</dict></array>
<key>NSPrivacyAccessedAPITypes</key><array/>
</dict></plist>\n`;
fs.writeFileSync(privacyManifest, privacyManifestXml, "utf8");
console.log("Configured app privacy manifest: precise location for app functionality; no tracking or identity linking.");

const sourceIcon = path.join(rootDir, "images", "frenano-app-icon-1024.png");
const appIconDir = path.join(iosAppDir, "Assets.xcassets", "AppIcon.appiconset");
const appIcon = path.join(appIconDir, "AppIcon-1024.png");
const tempJpeg = path.join(appIconDir, ".AppIcon-1024-temp.jpg");
if (!fs.existsSync(sourceIcon)) {
  console.error("iOS configuration failed: images/frenano-app-icon-1024.png was not found.");
  process.exit(1);
}
fs.mkdirSync(appIconDir, { recursive:true });
for (const entry of fs.readdirSync(appIconDir)) {
  if (entry === "Contents.json" || entry === path.basename(appIcon)) continue;
  const stalePath = path.join(appIconDir, entry);
  if (fs.statSync(stalePath).isFile()) fs.unlinkSync(stalePath);
}
try {
  execFileSync("sips", [sourceIcon, "-s", "format", "jpeg", "-s", "formatOptions", "best", "--out", tempJpeg], { stdio:"ignore" });
  execFileSync("sips", ["-s", "format", "png", tempJpeg, "--out", appIcon], { stdio:"ignore" });
} catch (_) {
  console.error("iOS configuration failed while preparing the opaque 1024x1024 app icon with macOS sips.");
  process.exit(1);
} finally {
  if (fs.existsSync(tempJpeg)) fs.unlinkSync(tempJpeg);
}
const appIconContents = { images:[{ filename:"AppIcon-1024.png", idiom:"universal", platform:"ios", size:"1024x1024" }], info:{ author:"xcode", version:1 } };
fs.writeFileSync(path.join(appIconDir, "Contents.json"), `${JSON.stringify(appIconContents, null, 2)}\n`, "utf8");
console.log("Prepared opaque Frenano 1024x1024 iOS app icon.");

// Keep the native cold-start screen deliberately simple. Its purpose is to bridge
// the short period before WKWebView can paint, not to duplicate the app's branding.
const assetsDir = path.join(iosAppDir, "Assets.xcassets");
const launchBackgroundSource = path.join(rootDir, "images", "frenano-hero-background.jpg");
function writeLaunchImageSet(name, sourcePath, filename) {
  if (!fs.existsSync(sourcePath)) throw new Error(`Launch asset source not found: ${sourcePath}`);
  const dir = path.join(assetsDir, `${name}.imageset`);
  fs.mkdirSync(dir, { recursive:true });
  fs.copyFileSync(sourcePath, path.join(dir, filename));
  const contents = {
    images:[{ filename, idiom:"universal", scale:"1x" }, { idiom:"universal", scale:"2x" }, { idiom:"universal", scale:"3x" }],
    info:{ author:"xcode", version:1 }
  };
  fs.writeFileSync(path.join(dir, "Contents.json"), `${JSON.stringify(contents, null, 2)}\n`, "utf8");
}
writeLaunchImageSet("FrenanoLaunchBackground", launchBackgroundSource, "frenano-hero-background.jpg");

const launchStoryboard = path.join(iosAppDir, "Base.lproj", "LaunchScreen.storyboard");
fs.mkdirSync(path.dirname(launchStoryboard), { recursive:true });
const launchStoryboardXml = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="23094" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="FrenanoLaunchController">
    <device id="retina6_12" orientation="portrait" appearance="dark"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23084"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="FrenanoLaunchScene">
            <objects>
                <viewController id="FrenanoLaunchController" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="FrenanoLaunchView">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFill" image="FrenanoLaunchBackground" translatesAutoresizingMaskIntoConstraints="NO" id="FrenanoLaunchBackgroundView"/>
                            <view contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="FrenanoLaunchShade">
                                <color key="backgroundColor" red="0.015" green="0.071" blue="0.125" alpha="0.72" colorSpace="custom" customColorSpace="sRGB"/>
                            </view>
                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" text="Setting you up…" textAlignment="center" translatesAutoresizingMaskIntoConstraints="NO" id="FrenanoLaunchMessage">
                                <fontDescription key="fontDescription" type="system" weight="semibold" pointSize="18"/>
                                <color key="textColor" white="1" alpha="0.82" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                            </label>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="FrenanoLaunchSafeArea"/>
                        <color key="backgroundColor" red="0.024" green="0.094" blue="0.165" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="FrenanoLaunchBackgroundView" firstAttribute="top" secondItem="FrenanoLaunchView" secondAttribute="top" id="BgTop"/>
                            <constraint firstItem="FrenanoLaunchBackgroundView" firstAttribute="leading" secondItem="FrenanoLaunchView" secondAttribute="leading" id="BgLead"/>
                            <constraint firstAttribute="trailing" secondItem="FrenanoLaunchBackgroundView" secondAttribute="trailing" id="BgTrail"/>
                            <constraint firstAttribute="bottom" secondItem="FrenanoLaunchBackgroundView" secondAttribute="bottom" id="BgBottom"/>
                            <constraint firstItem="FrenanoLaunchShade" firstAttribute="top" secondItem="FrenanoLaunchView" secondAttribute="top" id="ShadeTop"/>
                            <constraint firstItem="FrenanoLaunchShade" firstAttribute="leading" secondItem="FrenanoLaunchView" secondAttribute="leading" id="ShadeLead"/>
                            <constraint firstAttribute="trailing" secondItem="FrenanoLaunchShade" secondAttribute="trailing" id="ShadeTrail"/>
                            <constraint firstAttribute="bottom" secondItem="FrenanoLaunchShade" secondAttribute="bottom" id="ShadeBottom"/>
                            <constraint firstItem="FrenanoLaunchMessage" firstAttribute="centerX" secondItem="FrenanoLaunchView" secondAttribute="centerX" id="MessageCenterX"/>
                            <constraint firstItem="FrenanoLaunchMessage" firstAttribute="centerY" secondItem="FrenanoLaunchView" secondAttribute="centerY" id="MessageCenterY"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="FrenanoLaunchFirstResponder" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="50" y="50"/>
        </scene>
    </scenes>
    <resources>
        <image name="FrenanoLaunchBackground" width="1200" height="800"/>
    </resources>
</document>
`;
fs.writeFileSync(launchStoryboard, launchStoryboardXml, "utf8");
console.log("Configured minimal native launch screen for cold WebView startup.");

// Add cold-start instrumentation plus a minimal underlay behind WKWebView. The native
// timing markers let us separate app launch, bridge availability and actual JS startup.
const appDelegatePath = path.join(iosAppDir, "AppDelegate.swift");
if (fs.existsSync(appDelegatePath)) {
  let swift = fs.readFileSync(appDelegatePath, "utf8");

  swift = swift.replace(/^\s*let frenanoLaunchMs = Int\(Date\(\)\.timeIntervalSince1970 \* 1000\)\s*\n\s*print\("\[FRENANO_COLD_START\] native_app_launch epoch_ms=\\\(frenanoLaunchMs\)"\)\s*\n/gm, "");
  swift = swift.replace(/\n\s*\/\/ FRENANO_WEBVIEW_BRIDGE_BEGIN[\s\S]*?\/\/ FRENANO_WEBVIEW_BRIDGE_END\s*\n/g, "\n");

  const didFinishPattern = /(func application\(\s*_ application: UIApplication,\s*didFinishLaunchingWithOptions[\s\S]*?\) -> Bool \{)/;
  const match = swift.match(didFinishPattern);
  if (!match) throw new Error("didFinishLaunchingWithOptions could not be found for cold-start instrumentation");

  const injection = `${match[1]}
        let frenanoLaunchMs = Int(Date().timeIntervalSince1970 * 1000)
        print("[FRENANO_COLD_START] native_app_launch epoch_ms=\\(frenanoLaunchMs)")

        // FRENANO_WEBVIEW_BRIDGE_BEGIN
        let frenanoBlue = UIColor(red: 0.024, green: 0.094, blue: 0.165, alpha: 1.0)
        window?.backgroundColor = frenanoBlue
        DispatchQueue.main.async { [weak self] in
            let bridgeDispatchMs = Int(Date().timeIntervalSince1970 * 1000)
            print("[FRENANO_COLD_START] native_bridge_dispatch epoch_ms=\\(bridgeDispatchMs)")

            guard let self = self,
                  let bridge = self.window?.rootViewController as? CAPBridgeViewController else {
                let bridgeMissingMs = Int(Date().timeIntervalSince1970 * 1000)
                print("[FRENANO_COLD_START] native_bridge_missing epoch_ms=\\(bridgeMissingMs)")
                return
            }

            let bridgeReadyMs = Int(Date().timeIntervalSince1970 * 1000)
            print("[FRENANO_COLD_START] native_bridge_ready epoch_ms=\\(bridgeReadyMs)")

            bridge.view.backgroundColor = frenanoBlue
            bridge.webView?.isOpaque = false
            bridge.webView?.backgroundColor = .clear
            bridge.webView?.scrollView.backgroundColor = .clear

            guard bridge.view.viewWithTag(734901) == nil else { return }
            let underlay = UIView(frame: bridge.view.bounds)
            underlay.tag = 734901
            underlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            underlay.backgroundColor = frenanoBlue

            if let bgImage = UIImage(named: "FrenanoLaunchBackground") {
                let bg = UIImageView(frame: underlay.bounds)
                bg.image = bgImage
                bg.contentMode = .scaleAspectFill
                bg.clipsToBounds = true
                bg.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                underlay.addSubview(bg)
            }

            let shade = UIView(frame: underlay.bounds)
            shade.backgroundColor = UIColor(red: 0.015, green: 0.071, blue: 0.125, alpha: 0.72)
            shade.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            underlay.addSubview(shade)

            let spinner = UIActivityIndicatorView(style: .medium)
            spinner.color = UIColor.white.withAlphaComponent(0.72)
            spinner.translatesAutoresizingMaskIntoConstraints = false
            spinner.startAnimating()
            underlay.addSubview(spinner)

            let message = UILabel()
            message.text = "Setting you up…"
            message.textColor = UIColor.white.withAlphaComponent(0.82)
            message.font = .systemFont(ofSize: 18, weight: .semibold)
            message.textAlignment = .center
            message.translatesAutoresizingMaskIntoConstraints = false
            underlay.addSubview(message)

            NSLayoutConstraint.activate([
                spinner.centerXAnchor.constraint(equalTo: underlay.centerXAnchor),
                spinner.centerYAnchor.constraint(equalTo: underlay.centerYAnchor, constant: -22),
                message.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 14),
                message.centerXAnchor.constraint(equalTo: underlay.centerXAnchor)
            ])

            bridge.view.insertSubview(underlay, at: 0)
            let underlayReadyMs = Int(Date().timeIntervalSince1970 * 1000)
            print("[FRENANO_COLD_START] native_underlay_ready epoch_ms=\\(underlayReadyMs)")
        }
        // FRENANO_WEBVIEW_BRIDGE_END`;

  swift = swift.replace(match[1], injection);
  fs.writeFileSync(appDelegatePath, swift, "utf8");
  console.log("Configured native cold-start timing and minimal WebView underlay.");
}

console.log("iOS native configuration complete.");
