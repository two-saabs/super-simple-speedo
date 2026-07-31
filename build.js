const fs = require("fs");
const path = require("path");

const key = process.env.GEOAPIFY_API_KEY;

if (!key) {
  console.error("Build failed: GEOAPIFY_API_KEY is not set in Netlify.");
  process.exit(1);
}

const rootDir = __dirname;
const outputDir = path.join(rootDir, "dist");

function readRequiredFile(filename) {
  const filePath = path.join(rootDir, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`Build failed: required file "${filename}" was not found.`);
    process.exit(1);
  }

  return fs.readFileSync(filePath, "utf8");
}

function writeOutputFile(filename, contents) {
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, contents, "utf8");
  console.log(`Built dist/${filename}.`);
}

function replaceRequiredPlaceholder(source, placeholder, value, filename) {
  if (!source.includes(placeholder)) {
    console.error(
      `Build failed: placeholder "${placeholder}" was not found in ${filename}.`
    );
    process.exit(1);
  }

  return source.replaceAll(placeholder, value);
}

/*
 * version.json is the single source of truth for the application version.
 */
let appVersion;

try {
  const versionConfig = JSON.parse(readRequiredFile("version.json"));
  appVersion = versionConfig.version;
} catch (error) {
  console.error("Build failed: version.json is not valid JSON.");
  process.exit(1);
}

if (
  typeof appVersion !== "string" ||
  !/^\d+\.\d+\.\d+$/.test(appVersion)
) {
  console.error(
    'Build failed: version.json must contain a semantic version such as "12.3.0".'
  );
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

/*
 * Build the application HTML.
 */
let html = readRequiredFile("index.template.html");

html = replaceRequiredPlaceholder(
  html,
  "__GEOAPIFY_API_KEY__",
  key,
  "index.template.html"
);

html = replaceRequiredPlaceholder(
  html,
  "__APP_VERSION__",
  appVersion,
  "index.template.html"
);

writeOutputFile("index.html", html);

/*
 * Build the service worker using the same application version.
 */
let serviceWorker = readRequiredFile("service-worker.js");

serviceWorker = replaceRequiredPlaceholder(
  serviceWorker,
  "__APP_VERSION__",
  appVersion,
  "service-worker.js"
);

writeOutputFile("service-worker.js", serviceWorker);

/*
 * Copy required static files that do not need templating.
 */
const staticFiles = [
  "manifest.webmanifest",
  "_headers"
];

for (const file of staticFiles) {
  const sourceFile = path.join(rootDir, file);

  if (!fs.existsSync(sourceFile)) {
    console.error(`Build failed: required file "${file}" was not found.`);
    process.exit(1);
  }

  fs.copyFileSync(sourceFile, path.join(outputDir, file));
  console.log(`Copied ${file} to dist.`);
}

/*
 * Copy asset directories.
 */
const assetDirectories = ["audio", "icons"];

for (const directory of assetDirectories) {
  const sourceDirectory = path.join(rootDir, directory);
  const outputDirectory = path.join(outputDir, directory);

  if (!fs.existsSync(sourceDirectory)) {
    console.error(
      `Build failed: required directory "${directory}" was not found.`
    );
    process.exit(1);
  }

  fs.cpSync(sourceDirectory, outputDirectory, { recursive: true });
  console.log(`Copied ${directory} to dist/${directory}.`);
}

console.log(`Built Super Simple Speedo v${appVersion} successfully.`);
