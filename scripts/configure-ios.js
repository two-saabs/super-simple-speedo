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

// Native launch screen stays plain black so it hands off cleanly to the Frenano in-app startup screen.
// Keep this as a conventional Interface Builder storyboard. Xcode can reject a hand-minified
// storyboard even when its XML is technically well-formed, so preserve the standard plugin,
// capabilities and canvas metadata used by the last known-good App Store launch storyboard.
const launchStoryboard = path.join(iosAppDir, "Base.lproj", "LaunchScreen.storyboard");
fs.mkdirSync(path.dirname(launchStoryboard), { recursive:true });
const launchStoryboardXml = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="23094" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="FrenanoLaunchController">
    <device id="retina6_12" orientation="portrait" appearance="dark"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23084"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="System colors in document resources" minToolsVersion="11.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="FrenanoLaunchScene">
            <objects>
                <viewController id="FrenanoLaunchController" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="FrenanoLaunchView">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <viewLayoutGuide key="safeArea" id="FrenanoLaunchSafeArea"/>
                        <color key="backgroundColor" white="0.0" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="FrenanoLaunchFirstResponder" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="50" y="50"/>
        </scene>
    </scenes>
</document>
`;
fs.writeFileSync(launchStoryboard, launchStoryboardXml, "utf8");
console.log("Configured black native launch screen to match Frenano's first frame.");
console.log("iOS native configuration complete.");
