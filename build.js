const fs = require("fs");
const path = require("path");
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
const versionConfig = JSON.parse(readRequiredFile("version.json"));
const appVersion = versionConfig.version;
if (typeof appVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(appVersion)) { console.error("Invalid version.json"); process.exit(1); }
fs.mkdirSync(outputDir, { recursive: true });
let html = readRequiredFile("index.template.html");
html = replaceAllRequired(html, "__GEOAPIFY_API_KEY__", key, "index.template.html");
html = replaceAllRequired(html, "__APP_VERSION__", appVersion, "index.template.html");
writeOutputFile("index.html", html);
let sw = readRequiredFile("service-worker.js");
sw = replaceAllRequired(sw, "__APP_VERSION__", appVersion, "service-worker.js");
writeOutputFile("service-worker.js", sw);
for (const filename of ["manifest.webmanifest", "_headers"]) {
  const src = path.join(rootDir, filename);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outputDir, filename));
}
for (const dir of ["audio", "icons"]) {
  const src = path.join(rootDir, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(outputDir, dir), { recursive: true });
}
console.log(`Built Super Simple Speedo v${appVersion} successfully.`);
