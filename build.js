const fs = require("fs");
const path = require("path");
const { injectSupportDiagnostics } = require("./support-diagnostics");
const key = process.env.GEOAPIFY_API_KEY;
if (!key) { console.error("Build failed: GEOAPIFY_API_KEY is not set in Netlify."); process.exit(1); }
const rootDir = __dirname;
const outputDir = path.join(rootDir, "dist");
function readRequiredFile(filename) {
  const p = path.join(rootDir, filename);
  if (!fs.existsSync(p)) { console.error(`Build failed: required file "${filename}" was not found.`); process.exit(1); }
  return fs.readFileSync(p, "utf8");
}
function writeOutputFile(filename, contents) { fs.writeFileSync(path.join(outputDir, filename), contents, "utf8"); }
function replaceAllRequired(source, placeholder, value, filename) {
  if (!source.includes(placeholder)) { console.error(`Build failed: placeholder "${placeholder}" was not found in ${filename}.`); process.exit(1); }
  return source.replaceAll(placeholder, value);
}
function replaceRequiredSnippet(source, before, after, filename) {
  if (!source.includes(before)) { console.error(`Build failed: expected release-control snippet was not found in ${filename}.`); process.exit(1); }
  return source.replace(before, after);
}
const versionConfig = JSON.parse(readRequiredFile("version.json"));
const appVersion = versionConfig.version;
if (typeof appVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(appVersion)) { console.error("Invalid version.json"); process.exit(1); }
const buildProfile = JSON.parse(readRequiredFile("build-profile.json"));
const experimentalFeatures = buildProfile.experimentalFeatures === true;
const buildChannel = experimentalFeatures ? "experimental" : "stable";
if (!["stable", "experimental"].includes(buildProfile.channel) || buildProfile.channel !== buildChannel) {
  console.error("Invalid build-profile.json");
  process.exit(1);
}
fs.mkdirSync(outputDir, { recursive: true });
let html = readRequiredFile("index.template.html");
html = replaceAllRequired(html, "__GEOAPIFY_API_KEY__", key, "index.template.html");
html = replaceAllRequired(html, "__APP_VERSION__", appVersion, "index.template.html");
html = replaceRequiredSnippet(html, "Free forever. ", "", "index.template.html");
html = injectSupportDiagnostics(html, { appVersion, buildChannel, experimentalFeatures });
if (experimentalFeatures) {
  html = replaceRequiredSnippet(html, `Version ${appVersion}`, `Version ${appVersion} · Experimental`, "index.template.html");
} else {
  html = replaceRequiredSnippet(
    html,
    '<div class="settings-section" data-settings-section="advanced-and-experimental-features">',
    '<div class="settings-section hidden-element" data-settings-section="advanced-and-experimental-features" aria-hidden="true">',
    "index.template.html"
  );
}
const releaseGuard = `(() => {\n  const EXPERIMENTAL_FEATURES = ${experimentalFeatures};\n  const BUILD_CHANNEL = ${JSON.stringify(buildChannel)};\n  if (!EXPERIMENTAL_FEATURES) {\n    ["experimentalMode", "transportDetectiveEnabled", "journeyModeEnabled", "visualTheme"].forEach(key => localStorage.removeItem(key));\n    const nativeFetch = window.fetch.bind(window);\n    window.fetch = (input, init) => {\n      const url = typeof input === "string" ? input : (input?.url || "");\n      if (String(url).includes("transport.opendata.ch")) {\n        return Promise.reject(new Error("Experimental transport API disabled in stable build"));\n      }\n      return nativeFetch(input, init);\n    };\n  }`;
html = replaceRequiredSnippet(html, "(() => {", releaseGuard, "index.template.html");
html = replaceRequiredSnippet(
  html,
  'experimentalMode: localStorage.getItem("experimentalMode") === "true",',
  'experimentalMode: EXPERIMENTAL_FEATURES && localStorage.getItem("experimentalMode") === "true",',
  "index.template.html"
);
html = replaceRequiredSnippet(
  html,
  'transportDetectiveEnabled: localStorage.getItem("transportDetectiveEnabled") === "true",',
  'transportDetectiveEnabled: EXPERIMENTAL_FEATURES && localStorage.getItem("transportDetectiveEnabled") === "true",',
  "index.template.html"
);
html = replaceRequiredSnippet(
  html,
  'journeyModeEnabled: localStorage.getItem("journeyModeEnabled") === "true",',
  'journeyModeEnabled: EXPERIMENTAL_FEATURES && localStorage.getItem("journeyModeEnabled") === "true",',
  "index.template.html"
);
html = replaceRequiredSnippet(
  html,
  'visualTheme: localStorage.getItem("visualTheme") || "classic",',
  'visualTheme: EXPERIMENTAL_FEATURES ? (localStorage.getItem("visualTheme") || "classic") : "classic",',
  "index.template.html"
);
writeOutputFile("index.html", html);
let sw = readRequiredFile("service-worker.js");
sw = replaceAllRequired(sw, "__APP_VERSION__", appVersion, "service-worker.js");
writeOutputFile("service-worker.js", sw);
for (const filename of ["manifest.webmanifest", "_headers", "privacy.html"]) {
  const src = path.join(rootDir, filename);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outputDir, filename));
}
for (const dir of ["audio", "icons"]) {
  const src = path.join(rootDir, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(outputDir, dir), { recursive: true });
}
console.log(`Built Super Simple Speedo v${appVersion} (${buildChannel}) successfully.`);