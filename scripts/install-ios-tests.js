const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'ios-tests');
const iosDir = path.join(root, 'ios', 'App');
const destinationDir = path.join(iosDir, 'AppUITests');

if (!fs.existsSync(iosDir)) {
  console.error('iOS test install failed: ios/App was not found. Run `npm run ios:init` or `npm run ios:sync` first.');
  process.exit(1);
}

fs.mkdirSync(destinationDir, { recursive: true });

for (const file of fs.readdirSync(sourceDir)) {
  if (!file.endsWith('.swift')) continue;
  fs.copyFileSync(path.join(sourceDir, file), path.join(destinationDir, file));
  console.log(`Installed ${file} -> ios/App/AppUITests/${file}`);
}

console.log('\nTest sources installed.');
console.log('One-time Xcode step: add an iOS UI Testing Bundle target named AppUITests, then add ios/App/AppUITests/*.swift to that target.');
console.log('After that, Command-U runs the suite. Enable code coverage in Product > Scheme > Edit Scheme > Test > Options.');
