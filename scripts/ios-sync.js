const { spawnSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

function git(args, fallback = "unknown") {
  try {
    return execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function run(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env
  });

  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed\n`);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
}

const branch = git(["branch", "--show-current"]);
const commit = git(["log", "-1", "--pretty=format:%h"]);
const commitMessage = git(["log", "-1", "--pretty=format:%s"]);
const dirty = git(["status", "--porcelain"], "");

let version = "unknown";
try {
  version = JSON.parse(fs.readFileSync(path.join(rootDir, "version.json"), "utf8")).version;
} catch {}

console.log("\nFrenano iOS sync");
console.log("────────────────────────────────────────");
console.log(`Branch:  ${branch}`);
console.log(`Commit:  ${commit} — ${commitMessage}`);
console.log(`Version: ${version}`);
console.log("Mode:    stable");
if (dirty) console.log("⚠ Local checkout has uncommitted changes");
console.log("");

run("Build iOS web assets", "npm", ["run", "build:ios"]);
console.log("✓ Built iOS web assets");

run("Sync Capacitor", "npx", ["cap", "sync", "ios"]);
console.log("✓ Synced Capacitor");

run("Configure native iOS", "node", ["scripts/configure-ios.js"]);
console.log("✓ Configured native iOS");

run("Configure iOS keep-awake", "node", ["scripts/configure-ios-keep-awake.js"]);
console.log("✓ Configured native keep-awake");

run("Configure resilient startup bridge", "node", ["scripts/configure-ios-startup-bridge-retry.js"]);
console.log("✓ Configured resilient startup bridge");

console.log("✓ App icon and launch screen ready");
console.log("\niOS sync complete ✓\n");
