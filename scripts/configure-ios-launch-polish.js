'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const iosAppDir = path.join(rootDir, 'ios', 'App', 'App');
const assetsDir = path.join(iosAppDir, 'Assets.xcassets');

const sourceBackground = path.join(rootDir, 'images', 'frenano-startup-background.png');
const startupAssetName = 'FrenanoStartupBackground';
const legacyAssetName = 'FrenanoLaunchBackground';
const launchImageSet = path.join(assetsDir, `${startupAssetName}.imageset`);
const legacyImageSet = path.join(assetsDir, `${legacyAssetName}.imageset`);
if (!fs.existsSync(sourceBackground)) {
  throw new Error('Launch polish failed: images/frenano-startup-background.png not found');
}

// configure-ios.js creates the legacy launch set first. Remove it completely so Xcode
// cannot keep the old hero image around as an assigned or unassigned child.
fs.rmSync(legacyImageSet, { recursive: true, force: true });

// Recreate the startup set from scratch on every sync. This avoids stale asset-catalog
// children and guarantees Contents.json points only at the current startup background.
fs.rmSync(launchImageSet, { recursive: true, force: true });
fs.mkdirSync(launchImageSet, { recursive: true });
const launchFilename = 'frenano-startup-background.png';
fs.copyFileSync(sourceBackground, path.join(launchImageSet, launchFilename));
fs.writeFileSync(path.join(launchImageSet, 'Contents.json'), `${JSON.stringify({
  images: [
    { filename: launchFilename, idiom: 'universal', scale: '1x' },
    { idiom: 'universal', scale: '2x' },
    { idiom: 'universal', scale: '3x' }
  ],
  info: { author: 'xcode', version: 1 }
}, null, 2)}\n`, 'utf8');
console.log('Launch polish: recreated dedicated Frenano startup background asset and removed legacy launch asset.');

const storyboardPath = path.join(iosAppDir, 'Base.lproj', 'LaunchScreen.storyboard');
if (!fs.existsSync(storyboardPath)) {
  throw new Error('Launch polish failed: LaunchScreen.storyboard not found');
}

let storyboard = fs.readFileSync(storyboardPath, 'utf8');
storyboard = storyboard.replaceAll(legacyAssetName, startupAssetName);
storyboard = storyboard.replace(/\n\s*<view contentMode="scaleToFill"[^>]*id="FrenanoLaunchShade">[\s\S]*?<\/view>/, '');
storyboard = storyboard.replace(/\n\s*<label[^>]*id="FrenanoLaunchMessage">[\s\S]*?<\/label>/, '');
storyboard = storyboard.replace(/\n\s*<constraint[^>]*(?:firstItem|secondItem)="FrenanoLaunchShade"[^>]*\/>/g, '');
storyboard = storyboard.replace(/\n\s*<constraint[^>]*(?:firstItem|secondItem)="FrenanoLaunchMessage"[^>]*\/>/g, '');
fs.writeFileSync(storyboardPath, storyboard, 'utf8');
console.log('Launch polish: native cold-start screen now references the dedicated startup image.');

const appDelegatePath = path.join(iosAppDir, 'AppDelegate.swift');
if (fs.existsSync(appDelegatePath)) {
  let swift = fs.readFileSync(appDelegatePath, 'utf8');

  swift = swift.replaceAll(legacyAssetName, startupAssetName);
  swift = swift.replace(/\n\s*let shade = UIView\(frame: underlay\.bounds\)[\s\S]*?underlay\.addSubview\(shade\)\n/, '\n');
  swift = swift.replace(/\n\s*let spinner = UIActivityIndicatorView\(style: \.medium\)[\s\S]*?underlay\.addSubview\(message\)\n/, '\n');
  swift = swift.replace(/\n\s*NSLayoutConstraint\.activate\(\[\s*spinner\.centerXAnchor[\s\S]*?\]\)\n/, '\n');

  fs.writeFileSync(appDelegatePath, swift, 'utf8');
  console.log('Launch polish: WebView underlay now uses the dedicated startup image with no shade or message.');
}
