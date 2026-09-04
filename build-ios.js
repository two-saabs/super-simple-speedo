const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const esbuild = require("esbuild");

const rootDir = __dirname;
const distDir = path.join(rootDir, "dist");
const distHtml = path.join(distDir, "index.html");

execFileSync(process.execPath, [path.join(rootDir, "build.js")], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env
});

let html = fs.readFileSync(distHtml, "utf8");
const appVersion = JSON.parse(fs.readFileSync(path.join(rootDir, "version.json"), "utf8")).version;
const appStoreVersion = "1.0";
function zurichBuildTime() {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short"
  }).formatToParts(new Date());
  const get = type => parts.find(part => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} ${get("timeZoneName")}`;
}
const buildTimeZurich = zurichBuildTime();

function replaceRequired(before, after, label) {
  if (!html.includes(before)) {
    console.error(`iOS build failed: expected ${label} was not found.`);
    process.exit(1);
  }
  html = html.replace(before, after);
}

if (!html.includes('id="appBuildTime"')) {
  replaceRequired(
    `<div style="margin-top:8px;opacity:.55;">\n          Version ${appVersion}\n        </div>`,
    `<div style="margin-top:8px;opacity:.55;">\n          Version ${appStoreVersion}\n        </div>\n        <div id="appBuildTime" style="margin-top:5px;opacity:.42;font-size:12px;">\n          Build ${appVersion} - ${buildTimeZurich}\n        </div>`,
    "About version number"
  );
}

esbuild.buildSync({
  entryPoints: [path.join(rootDir, "native-ios.js")],
  outfile: path.join(distDir, "native-ios.bundle.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["safari15"],
  minify: true,
  sourcemap: false
});

replaceRequired(
  "<head>",
  `<head>\n  <script>window.__SPEEDO_NATIVE_IOS__ = true;</script>\n  <script src="./native-ios.bundle.js"></script>\n  <style>\n    #installCard, #iosInstallModal, #fullscreenButton { display: none !important; }\n  </style>`,
  "document head"
);

replaceRequired(
  'if ("serviceWorker" in navigator) {',
  'if (!window.__SPEEDO_NATIVE_IOS__ && "serviceWorker" in navigator) {',
  "service-worker registration guard"
);

if (!html.includes("navigator.geolocation")) {
  console.error("iOS build failed: stable geolocation calls were not found.");
  process.exit(1);
}
html = html.replaceAll("navigator.geolocation", "window.__SPEEDO_NATIVE_GEOLOCATION__");

// The web build now restructures Privacy into the unified Help & privacy section.
// Anchor the native-only location controls to the first item in that generated
// section instead of the old privacy-copy wrapper, which no longer exists.
replaceRequired(
  '        <div class="setting" style="margin:0;padding:0 0 22px;border:0;">\n          <div class="setting-title" style="font-size:19px;">Need help?</div>',
  `        <div class="setting" id="nativeLocationPermissionSetting" style="margin:0;padding:0 0 22px;border:0;">\n          <div class="setting-title">Location access</div>\n          <div class="setting-note">Used for your current speed and automatic road/speed-limit lookup.</div>\n          <div class="setting-note" style="margin-top:8px;">Current permission: <strong id="nativeLocationPermissionStatus">Checking…</strong></div>\n          <button class="wide-button secondary" id="manageLocationPermission" style="margin-top:12px;">Manage in iPhone Settings</button>\n        </div>\n\n        <div class="setting" style="margin:0;padding:22px 0;border-top:1px solid rgba(127,127,127,.18);">\n          <div class="setting-title" style="font-size:19px;">Need help?</div>`,
  "native location permission settings block"
);

// The unified web settings already contain the Privacy Policy link. For the
// native WKWebView make it absolute so it opens the public policy rather than
// resolving to a bundled local file path.
replaceRequired(
  'href="/privacy.html" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;font-weight:700;">Read privacy policy</a>',
  'href="https://supersimplespeedo.app/privacy.html" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;font-weight:700;">Read privacy policy</a>',
  "in-app privacy policy link"
);

const injectedKey = process.env.GEOAPIFY_API_KEY;
if (!injectedKey) {
  console.error("iOS build failed: GEOAPIFY_API_KEY is required to build the stable source before sanitising it.");
  process.exit(1);
}
replaceRequired(
  `apiKey: ${JSON.stringify(injectedKey)},`,
  'apiKey: "ios-secure-proxy",',
  "injected Geoapify key"
);

replaceRequired(
  'const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}&format=json&apiKey=${encodeURIComponent(state.apiKey)}`;',
  'const url = `https://supersimplespeedo.app/.netlify/functions/geoapify-proxy?action=reverse&lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}`;',
  "Geoapify reverse-geocode URL"
);

replaceRequired(
  'const lookupUrl = `https://api.geoapify.com/v1/mapmatching?apiKey=${encodeURIComponent(state.apiKey)}`;',
  'const lookupUrl = "https://supersimplespeedo.app/.netlify/functions/geoapify-proxy?action=mapmatching";',
  "Geoapify map-matching URL"
);

if (html.includes(injectedKey)) {
  console.error("iOS build failed: Geoapify key is still present in the packaged HTML.");
  process.exit(1);
}

if (html.includes("navigator.geolocation")) {
  console.error("iOS build failed: a WKWebView geolocation call remains in the packaged HTML.");
  process.exit(1);
}

fs.writeFileSync(distHtml, html, "utf8");
console.log("Prepared stable Super Simple Speedo for the iOS App Store shell.");
console.log("iOS location now uses native Capacitor permission handling and exposes system permission status in Settings.");
console.log("Privacy Policy is linked from the iOS Privacy settings.");
console.log("Geoapify calls use the secure server proxy; no Geoapify API key is packaged in iOS.");
