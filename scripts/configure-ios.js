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
const locationKeys = [
  "NSLocationWhenInUseUsageDescription",
  // App Store static analysis can require this key when a linked location SDK
  // references APIs capable of always-on location, even though Speedo itself
  // requests foreground/while-in-use permission only.
  "NSLocationAlwaysAndWhenInUseUsageDescription"
];
const locationCopy = "Super Simple Speedo uses your location while you use the app to calculate your current speed and look up the road's speed limit.";

let locationPlistChanged = false;
for (const locationKey of locationKeys) {
  if (!plist.includes(`<key>${locationKey}</key>`)) {
    const insertion = `\n\t<key>${locationKey}</key>\n\t<string>${locationCopy}</string>\n`;
    const rootClose = plist.lastIndexOf("</dict>");
    if (rootClose === -1) {
      console.error("iOS configuration failed: Info.plist root dictionary could not be found.");
      process.exit(1);
    }
    plist = plist.slice(0, rootClose) + insertion + plist.slice(rootClose);
    locationPlistChanged = true;
    console.log(`Added ${locationKey} purpose string to Info.plist.`);
  }
}
if (locationPlistChanged) {
  fs.writeFileSync(infoPlist, plist, "utf8");
} else {
  console.log("Required iOS location purpose strings are already configured.");
}

// App-level privacy manifest. Speedo uses precise location for core app
// functionality (speed plus automatic road/speed-limit lookup), does not link
// it to an account/identity, and does not use it for tracking. Required-reason
// API declarations belong here only if Speedo itself starts using such APIs;
// linked SDKs remain responsible for their own privacy manifests.
const privacyManifest = path.join(iosAppDir, "PrivacyInfo.xcprivacy");
const privacyManifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePreciseLocation</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <false/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array/>
</dict>
</plist>
`;
fs.writeFileSync(privacyManifest, privacyManifestXml, "utf8");
console.log("Configured app privacy manifest: precise location for app functionality; no tracking or identity linking.");

// Keep the native App Store icon in sync with the approved 1024px Speedo icon.
// Apple requires an opaque 1024x1024 marketing icon, so we deliberately
// round-trip through JPEG before writing the final PNG to strip any alpha.
const sourceIcon = path.join(rootDir, "icons", "icon-1024.png");
const appIconDir = path.join(iosAppDir, "Assets.xcassets", "AppIcon.appiconset");
const appIcon = path.join(appIconDir, "AppIcon-1024.png");
const tempJpeg = path.join(appIconDir, ".AppIcon-1024-temp.jpg");

if (!fs.existsSync(sourceIcon)) {
  console.error("iOS configuration failed: icons/icon-1024.png was not found.");
  process.exit(1);
}

fs.mkdirSync(appIconDir, { recursive: true });
try {
  execFileSync("sips", [sourceIcon, "-s", "format", "jpeg", "-s", "formatOptions", "best", "--out", tempJpeg], { stdio: "ignore" });
  execFileSync("sips", ["-s", "format", "png", tempJpeg, "--out", appIcon], { stdio: "ignore" });
} catch (error) {
  console.error("iOS configuration failed while preparing the 1024x1024 app icon with macOS sips.");
  process.exit(1);
} finally {
  if (fs.existsSync(tempJpeg)) fs.unlinkSync(tempJpeg);
}

const appIconContents = {
  images: [
    {
      filename: "AppIcon-1024.png",
      idiom: "universal",
      platform: "ios",
      size: "1024x1024"
    }
  ],
  info: {
    author: "xcode",
    version: 1
  }
};
fs.writeFileSync(path.join(appIconDir, "Contents.json"), `${JSON.stringify(appIconContents, null, 2)}\n`, "utf8");
console.log("Prepared opaque 1024x1024 iOS app icon from icons/icon-1024.png.");

// A launch screen should feel like the first frame of the app, not an advert
// or a second branded loading screen. Speedo's default canvas is black, so a
// plain black native launch screen hands over cleanly to the existing in-app
// startup presentation without a white flash or duplicated logo.
const launchStoryboard = path.join(iosAppDir, "Base.lproj", "LaunchScreen.storyboard");
fs.mkdirSync(path.dirname(launchStoryboard), { recursive: true });
const launchStoryboardXml = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="23094" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="SpeedoLaunchController">
    <device id="retina6_12" orientation="portrait" appearance="dark"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23084"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="System colors in document resources" minToolsVersion="11.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="SpeedoLaunchScene">
            <objects>
                <viewController id="SpeedoLaunchController" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="SpeedoLaunchView">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <viewLayoutGuide key="safeArea" id="SpeedoLaunchSafeArea"/>
                        <color key="backgroundColor" white="0.0" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="SpeedoLaunchFirstResponder" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="50" y="50"/>
        </scene>
    </scenes>
</document>
`;
fs.writeFileSync(launchStoryboard, launchStoryboardXml, "utf8");
console.log("Configured a black native launch screen to match Speedo's first frame.");

console.log("iOS native configuration complete.");
