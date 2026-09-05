const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
function fail(message) { console.error(`FAIL  ${message}`); process.exitCode = 1; }
function pass(message) { console.log(`PASS  ${message}`); }
function readRoot(name) { return fs.readFileSync(path.join(root, name), "utf8"); }

const profile = JSON.parse(readRoot("build-profile.json"));
const build = readRoot("build.js");
const template = readRoot("index.template.html");
const version = JSON.parse(readRoot("version.json")).version;
const builtPath = path.join(root, "dist", "index.html");
const built = fs.existsSync(builtPath) ? fs.readFileSync(builtPath, "utf8") : "";
const allowed = new Set(["stable", "test", "experimental"]);

allowed.has(profile.channel) ? pass(`known channel: ${profile.channel}`) : fail(`unknown channel: ${profile.channel}`);
const isExperimental = profile.channel === "experimental";
profile.experimentalFeatures === isExperimental ? pass("experimental feature flag matches channel") : fail("experimental feature flag does not match channel");
profile.EXPERIMENTAL_FEATURES === isExperimental ? pass("legacy experimental feature flag matches channel") : fail("legacy experimental feature flag does not match channel");
/^\d+\.\d+\.\d+$/.test(version) ? pass(`semantic version: ${version}`) : fail("invalid version");

/--safe-top:\s*max\(14px,\s*env\(safe-area-inset-top\)\)/.test(template) ? pass("shared safe-top primitive present") : fail("shared safe-top primitive changed");
/#app\s*\{[\s\S]*?padding:\s*var\(--safe-top\)\s+18px\s+var\(--safe-bottom\)/.test(template) ? pass("shared app padding contract present") : fail("shared app padding contract changed");

/if \(buildChannel !== "stable"\)/.test(build) ? pass("channel marker is gated to non-stable builds") : fail("channel marker gating changed");
/Europe\/Zurich/.test(build) ? pass("non-stable build metadata uses Zurich timezone") : fail("Zurich build timezone missing");

if (!built) {
  fail("built output missing; run build.js before channel contract");
} else if (profile.channel === "test") {
  /TEST VERSION/.test(built) ? pass("test identity present in built output") : fail("test identity missing from built output");
  /build-channel-marker/.test(built) ? pass("test channel marker present") : fail("test channel marker missing");
  /EXPERIMENTAL VERSION/.test(built) ? fail("test build contains experimental marker") : pass("test has no experimental marker");
} else if (profile.channel === "experimental") {
  /EXPERIMENTAL VERSION/.test(built) ? pass("experimental identity present in built output") : fail("experimental identity missing from built output");
  /build-channel-marker/.test(built) ? pass("experimental channel marker present") : fail("experimental channel marker missing");
} else {
  /build-channel-marker/.test(built) ? fail("stable built output unexpectedly contains channel marker") : pass("stable built output has no channel marker");
  /TEST VERSION|EXPERIMENTAL VERSION/.test(built) ? fail("stable built output contains non-stable identity") : pass("stable built output has no non-stable identity");
}

const capPath = path.join(root, "capacitor.config.json");
if (fs.existsSync(capPath)) {
  const cap = JSON.parse(fs.readFileSync(capPath, "utf8"));
  cap.ios?.contentInset === "never" ? pass("iOS safe-area ownership is CSS-only") : fail("iOS contentInset must be never");
}

if (process.exitCode) process.exit(process.exitCode);
console.log("Channel contract OK.");
