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

// Keep the App Store icon synced to the approved Frenano 1024px production asset.
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

// Make cold-start time feel intentional by matching the native launch screen to the
// in-app Frenano startup view. The WebView can take noticeably longer on a true cold
// launch, so never expose a featureless black frame while WebKit is starting.
const assetsDir = path.join(iosAppDir, "Assets.xcassets");
const launchBackgroundSource = path.join(rootDir, "images", "frenano-hero-background.jpg");
const launchLogoSource = path.join(rootDir, "images", "frenano-startup-logo-512.png");
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
writeLaunchImageSet("FrenanoLaunchLogo", launchLogoSource, "frenano-startup-logo-512.png");

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
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFill" image="FrenanoLaunchLogo" translatesAutoresizingMaskIntoConstraints="NO" id="FrenanoLaunchLogoView">
                                <constraints>
                                    <constraint firstAttribute="width" constant="108" id="FrenanoLaunchLogoWidth"/>
                                    <constraint firstAttribute="height" constant="108" id="FrenanoLaunchLogoHeight"/>
                                </constraints>
                            </imageView>
                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" text="Frenano" textAlignment="center" translatesAutoresizingMaskIntoConstraints="NO" id="FrenanoLaunchName">
                                <fontDescription key="fontDescription" type="system" weight="heavy" pointSize="32"/>
                                <color key="textColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                            </label>
                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" text="GPS speedometer, simply done." textAlignment="center" translatesAutoresizingMaskIntoConstraints="NO" id="FrenanoLaunchTagline">
                                <fontDescription key="fontDescription" type="system" weight="semibold" pointSize="15"/>
                                <color key="textColor" white="1" alpha="0.65" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
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
                            <constraint firstItem="FrenanoLaunchLogoView" firstAttribute="centerX" secondItem="FrenanoLaunchView" secondAttribute="centerX" id="LogoCenterX"/>
                            <constraint firstItem="FrenanoLaunchLogoView" firstAttribute="centerY" secondItem="FrenanoLaunchView" secondAttribute="centerY" constant="-65" id="LogoCenterY"/>
                            <constraint firstItem="FrenanoLaunchName" firstAttribute="top" secondItem="FrenanoLaunchLogoView" secondAttribute="bottom" constant="16" id="NameTop"/>
                            <constraint firstItem="FrenanoLaunchName" firstAttribute="centerX" secondItem="FrenanoLaunchView" secondAttribute="centerX" id="NameCenterX"/>
                            <constraint firstItem="FrenanoLaunchTagline" firstAttribute="top" secondItem="FrenanoLaunchName" secondAttribute="bottom" constant="8" id="TagTop"/>
                            <constraint firstItem="FrenanoLaunchTagline" firstAttribute="centerX" secondItem="FrenanoLaunchView" secondAttribute="centerX" id="TagCenterX"/>
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
        <image name="FrenanoLaunchLogo" width="512" height="512"/>
    </resources>
</document>
`;
fs.writeFileSync(launchStoryboard, launchStoryboardXml, "utf8");
console.log("Configured branded native launch screen to bridge cold WebView startup.");

// Add one native timestamp at the earliest app lifecycle boundary we control. It uses
// Unix epoch milliseconds so the JS Date.now() markers can be compared directly.
const appDelegatePath = path.join(iosAppDir, "AppDelegate.swift");
if (fs.existsSync(appDelegatePath)) {
  let swift = fs.readFileSync(appDelegatePath, "utf8");
  const marker = "FRENANO_COLD_START native_app_launch";
  if (!swift.includes(marker)) {
    const didFinishPattern = /(func application\(\s*_ application: UIApplication,\s*didFinishLaunchingWithOptions[\s\S]*?\) -> Bool \{)/;
    const match = swift.match(didFinishPattern);
    if (!match) throw new Error("didFinishLaunchingWithOptions could not be found for cold-start instrumentation");
    const injection = `${match[1]}\n        let frenanoLaunchMs = Int(Date().timeIntervalSince1970 * 1000)\n        print("[FRENANO_COLD_START] native_app_launch epoch_ms=\\(frenanoLaunchMs)")`;
    swift = swift.replace(match[1], injection);
    fs.writeFileSync(appDelegatePath, swift, "utf8");
  }
  console.log("Configured native cold-start timestamp instrumentation.");
}

console.log("iOS native configuration complete.");
