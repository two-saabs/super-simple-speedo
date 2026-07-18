const fs = require("fs");
const path = require("path");

const key = process.env.GEOAPIFY_API_KEY;

if (!key) {
  console.error("Build failed: GEOAPIFY_API_KEY is not set in Netlify.");
  process.exit(1);
}

const sourcePath = path.join(__dirname, "index.template.html");
const outputDir = path.join(__dirname, "dist");
const outputPath = path.join(outputDir, "index.html");

const source = fs.readFileSync(sourcePath, "utf8");

if (!source.includes("__GEOAPIFY_API_KEY__")) {
  console.error("Build failed: API-key placeholder was not found.");
  process.exit(1);
}

const output = source.replaceAll("__GEOAPIFY_API_KEY__", key);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, output, "utf8");

console.log("Built dist/index.html successfully.");
