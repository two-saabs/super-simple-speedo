'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const iosAppDir = path.join(rootDir, 'ios', 'App', 'App');
const assetsDir = path.join(iosAppDir, 'Assets.xcassets');
const infoPlistPath = path.join(iosAppDir, 'Info.plist');

// Explicitly tell iOS which storyboard to use for the system launch screen. This is a
// deliberately small, reversible change and does not touch the working WebView underlay.
if (!fs.existsSync(infoPlistPath)) {
  throw new Error('Launch polish failed: Info.plist not found');
}
let plist = fs.readFileSync(infoPlistPath, 'utf8');
const launchStoryboardKey = '<key>UILaunchStoryboardName</key>';
const launchStoryboardEntry = `${launchStoryboardKey}\n\t<string>LaunchScreen</string>`;
if (plist.includes(launchStoryboardKey)) {
  plist = plist.replace(/<key>UILaunchStoryboardName<\/key>\s*<string>[^<]*<\/string>/, launchStoryboardEntry);
} else {
  const rootClose = plist.lastIndexOf('</dict>');
  if (rootClose === -1) throw new Error('Launch polish failed: Info.plist root dictionary not found');
  plist = `${plist.slice(0, rootClose)}\t${launchStoryboardEntry}\n${plist.slice(rootClose)}`;
}
fs.writeFileSync(infoPlistPath, plist, 'utf8');
console.log('Launch polish: explicitly configured UILaunchStoryboardName=LaunchScreen.');

const sourceBackground = path.join(rootDir, 'images', 'frenano-startup-background.png');
const launchAssetName = 'Splash';
const launchImageSet = path.join(assetsDir, `${launchAssetName}.imageset`);
const staleAssetNames = [
  'FrenanoLaunchBackground',
  'FrenanoLaunchBackground20260914',
  'FrenanoStartupBackground',
  'FrenanoStartupNative'
];

if (!fs.existsSync(sourceBackground)) {
  throw new Error('Launch polish failed: images/frenano-startup-background.png not found');
}

// Reuse Capacitor/Xcode's established Splash asset identity for the native launch screen.
// This avoids relying on a dynamically introduced launch-only image-set name.
for (const name of staleAssetNames) {
  fs.rmSync(path.join(assetsDir, `${name}.imageset`), { recursive: true, force: true });
}
fs.rmSync(launchImageSet, { recursive: true, force: true });
fs.mkdirSync(launchImageSet, { recursive: true });

const filenames = {
  '1x': 'frenano-startup-background-1x.png',
  '2x': 'frenano-startup-background-2x.png',
  '3x': 'frenano-startup-background-3x.png'
};
for (const filename of Object.values(filenames)) {
  fs.copyFileSync(sourceBackground, path.join(launchImageSet, filename));
}
fs.writeFileSync(path.join(launchImageSet, 'Contents.json'), `${JSON.stringify({
  images: [
    { filename: filenames['1x'], idiom: 'universal', scale: '1x' },
    { filename: filenames['2x'], idiom: 'universal', scale: '2x' },
    { filename: filenames['3x'], idiom: 'universal', scale: '3x' }
  ],
  info: { author: 'xcode', version: 1 }
}, null, 2)}\n`, 'utf8');
console.log('Launch polish: rebuilt Splash with the current startup background.');

const storyboardPath = path.join(iosAppDir, 'Base.lproj', 'LaunchScreen.storyboard');
if (!fs.existsSync(storyboardPath)) {
  throw new Error('Launch polish failed: LaunchScreen.storyboard not found');
}

let storyboard = fs.readFileSync(storyboardPath, 'utf8');
storyboard = storyboard.replace(/Frenano(?:LaunchBackground(?:20260914)?|StartupBackground|StartupNative)/g, launchAssetName);
storyboard = storyboard.replace(/\n\s*<view contentMode="scaleToFill"[^>]*id="FrenanoLaunchShade">[\s\S]*?<\/view>/, '');
storyboard = storyboard.replace(/\n\s*<label[^>]*id="FrenanoLaunchMessage">[\s\S]*?<\/label>/, '');
storyboard = storyboard.replace(/\n\s*<constraint[^>]*(?:firstItem|secondItem)="FrenanoLaunchShade"[^>]*\/>/g, '');
storyboard = storyboard.replace(/\n\s*<constraint[^>]*(?:firstItem|secondItem)="FrenanoLaunchMessage"[^>]*\/>/g, '');
fs.writeFileSync(storyboardPath, storyboard, 'utf8');
console.log('Launch polish: native cold-start screen uses Splash with no shade or message.');

const appDelegatePath = path.join(iosAppDir, 'AppDelegate.swift');
if (fs.existsSync(appDelegatePath)) {
  let swift = fs.readFileSync(appDelegatePath, 'utf8');
  swift = swift.replace(/Frenano(?:LaunchBackground(?:20260914)?|StartupBackground|StartupNative)/g, launchAssetName);
  swift = swift.replace(/\n\s*let shade = UIView\(frame: underlay\.bounds\)[\s\S]*?underlay\.addSubview\(shade\)\n/, '\n');
  swift = swift.replace(/\n\s*let spinner = UIActivityIndicatorView\(style: \.medium\)[\s\S]*?underlay\.addSubview\(message\)\n/, '\n');
  swift = swift.replace(/\n\s*NSLayoutConstraint\.activate\(\[\s*spinner\.centerXAnchor[\s\S]*?\]\)\n/, '\n');
  fs.writeFileSync(appDelegatePath, swift, 'utf8');
  console.log('Launch polish: WebView underlay uses Splash with no shade or message.');
}
