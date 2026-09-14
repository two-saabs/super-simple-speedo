'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const iosAppDir = path.join(rootDir, 'ios', 'App', 'App');
const assetsDir = path.join(iosAppDir, 'Assets.xcassets');

const sourceBackground = path.join(rootDir, 'images', 'frenano-startup-background.png');
const launchImageSet = path.join(assetsDir, 'FrenanoLaunchBackground.imageset');
if (!fs.existsSync(sourceBackground)) {
  throw new Error('Launch polish failed: images/frenano-startup-background.png not found');
}
fs.mkdirSync(launchImageSet, { recursive: true });
for (const entry of fs.readdirSync(launchImageSet)) {
  if (entry !== 'Contents.json') fs.rmSync(path.join(launchImageSet, entry), { recursive: true, force: true });
}
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
console.log('Launch polish: native launch now uses the exact Frenano startup background.');

const storyboardPath = path.join(iosAppDir, 'Base.lproj', 'LaunchScreen.storyboard');
if (!fs.existsSync(storyboardPath)) {
  throw new Error('Launch polish failed: LaunchScreen.storyboard not found');
}

let storyboard = fs.readFileSync(storyboardPath, 'utf8');
storyboard = storyboard.replace(/\n\s*<view contentMode="scaleToFill"[^>]*id="FrenanoLaunchShade">[\s\S]*?<\/view>/, '');
storyboard = storyboard.replace(/\n\s*<label[^>]*id="FrenanoLaunchMessage">[\s\S]*?<\/label>/, '');
storyboard = storyboard.replace(/\n\s*<constraint[^>]*(?:firstItem|secondItem)="FrenanoLaunchShade"[^>]*\/>/g, '');
storyboard = storyboard.replace(/\n\s*<constraint[^>]*(?:firstItem|secondItem)="FrenanoLaunchMessage"[^>]*\/>/g, '');
fs.writeFileSync(storyboardPath, storyboard, 'utf8');
console.log('Launch polish: native cold-start screen is the clean road image only.');

const appDelegatePath = path.join(iosAppDir, 'AppDelegate.swift');
if (fs.existsSync(appDelegatePath)) {
  let swift = fs.readFileSync(appDelegatePath, 'utf8');

  swift = swift.replace(/\n\s*let shade = UIView\(frame: underlay\.bounds\)[\s\S]*?underlay\.addSubview\(shade\)\n/, '\n');
  swift = swift.replace(/\n\s*let spinner = UIActivityIndicatorView\(style: \.medium\)[\s\S]*?underlay\.addSubview\(message\)\n/, '\n');
  swift = swift.replace(/\n\s*NSLayoutConstraint\.activate\(\[\s*spinner\.centerXAnchor[\s\S]*?\]\)\n/, '\n');

  fs.writeFileSync(appDelegatePath, swift, 'utf8');
  console.log('Launch polish: removed shade, spinner and “Setting you up…” from WebView underlay.');
}
