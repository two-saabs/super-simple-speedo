const fs = require("fs");
const path = require("path");
const { applySimpleStartup } = require("./startup-simple");

const appHtml = path.join(__dirname, "..", "dist", "app", "index.html");
if (!fs.existsSync(appHtml)) {
  console.error("Web startup post-process failed: dist/app/index.html was not found.");
  process.exit(1);
}

let html = fs.readFileSync(appHtml, "utf8");
html = applySimpleStartup(html);

if (!html.includes('id="letsDriveButton"')) {
  console.error("Web startup post-process failed: Let’s go button is missing.");
  process.exit(1);
}
if (!html.includes('frenano-startup-logo-512.png')) {
  console.error("Web startup post-process failed: Frenano startup logo is missing.");
  process.exit(1);
}
if (!html.includes('simple-startup-v1')) {
  console.error("Web startup post-process failed: simplified startup styles were not applied.");
  process.exit(1);
}

fs.writeFileSync(appHtml, html, "utf8");
console.log("Applied simplified Frenano web startup: new logo, no satellite/checklist, Let’s go retained.");
