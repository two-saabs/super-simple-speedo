const fs = require("fs");
const path = require("path");

function fail(message) { console.error(`FAIL  ${message}`); process.exitCode = 1; }
function pass(message) { console.log(`PASS  ${message}`); }
function read(name) { return fs.readFileSync(path.join(__dirname, name), "utf8"); }

const profile = JSON.parse(read("build-profile.json"));
const build = read("build.js");
const template = read("index.template.html");
const version = JSON.parse(read("version.json")).version;
const allowed = new Set(["stable", "test", "experimental"]);

allowed.has(profile.channel) ? pass(`known channel: ${profile.channel}`) : fail(`unknown channel: ${profile.channel}`);
const isExperimental = profile.channel === "experimental";
profile.experimentalFeatures === isExperimental ? pass("experimental feature flag matches channel") : fail("experimental feature flag does not match channel");
profile.EXPERIMENTAL_FEATURES === isExperimental ? pass("legacy experimental feature flag matches channel") : fail("legacy experimental feature flag does not match channel");
/^\d+\.\d+\.\d+$/.test(version) ? pass(`semantic version: ${version}`) : fail("invalid version");

// Shared portrait geometry must stay in the common template. Channel identity may
// reserve a band, but must not replace/reposition the shared header itself.
/template[\s\S]*/; // keep this script intentionally dependency-free
/--safe-top:\s*max\(14px,\s*env\(safe-area-inset-top\)\)/.test(template) ? pass("shared safe-top primitive present") : fail("shared safe-top primitive changed");
/#app\s*\{[\s\S]*?padding:\s*var\(--safe-top\)\s+18px\s+var\(--safe-bottom\)/.test(template) ? pass("shared app padding contract present") : fail("shared app padding contract changed");

if (profile.channel === "test") {
  /TEST VERSION/.test(build) ? pass("test identity present") : fail("test identity missing");
  /build-channel-meta/.test(build) && /built \$\{buildTimeUtc\}/.test(build) ? pass("test version/build timestamp present") : fail("test build metadata missing");
  /EXPERIMENTAL MODE/.test(build) ? fail("test build contains experimental marker") : pass("test has no experimental marker");
} else if (profile.channel === "experimental") {
  /EXPERIMENTAL MODE/.test(build) ? pass("experimental identity present") : fail("experimental identity missing");
  /build-channel-meta/.test(build) && /built \$\{buildTimeUtc\}/.test(build) ? pass("experimental version/build timestamp present") : fail("experimental build metadata missing");
} else {
  /build-channel-marker/.test(build) ? fail("stable build unexpectedly contains channel marker") : pass("stable build has no channel marker");
}

const capPath = path.join(__dirname, "capacitor.config.json");
if (fs.existsSync(capPath)) {
  const cap = JSON.parse(fs.readFileSync(capPath, "utf8"));
  cap.ios?.contentInset === "never" ? pass("iOS safe-area ownership is CSS-only") : fail("iOS contentInset must be never");
}

if (process.exitCode) process.exit(process.exitCode);
console.log("Channel contract OK.");
