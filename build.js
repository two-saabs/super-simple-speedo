const fs = require("fs");
const path = require("path");
const { injectSupportDiagnostics } = require("./build/support-diagnostics");
const { applyRoadFreshnessFix } = require("./build/road-freshness-fix");
const { applyStartupRobustnessFix } = require("./build/startup-robustness-fix");
const { applyHelpContactPrivacyFix } = require("./build/help-contact-privacy-fix");
const { applySettingsRedesign } = require("./build/settings-redesign");
const { applySettingsPolish } = require("./build/settings-polish");
const { applyBrandRefresh } = require("./build/brand-refresh");
const { applySimpleStartup } = require("./build/startup-simple");
const { applyRoadCardRefresh } = require("./build/road-card-refresh");
const key = process.env.GEOAPIFY_API_KEY;
if (!key) { console.error("Build failed: GEOAPIFY_API_KEY is not set in Netlify."); process.exit(1); }
const rootDir = __dirname;
const outputDir = path.join(rootDir, "dist");
function readRequiredFile(filename) { const p = path.join(rootDir, filename); if (!fs.existsSync(p)) { console.error(`Build failed: required file "${filename}" was not found.`); process.exit(1); } return fs.readFileSync(p, "utf8"); }
function writeOutputFile(filename, contents) { const target = path.join(outputDir, filename); fs.mkdirSync(path.dirname(target), { recursive:true }); fs.writeFileSync(target, contents, "utf8"); }
function replaceAllRequired(source, placeholder, value, filename) { if (!source.includes(placeholder)) { console.error(`Build failed: placeholder "${placeholder}" was not found in ${filename}.`); process.exit(1); } return source.replaceAll(placeholder, value); }
function replaceRequiredSnippet(source, before, after, filename) { if (!source.includes(before)) { console.error(`Build failed: expected release-control snippet was not found in ${filename}.`); process.exit(1); } return source.replace(before, after); }
function zurichBuildTime() { const parts = new Intl.DateTimeFormat("sv-SE", { timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZoneName:"short" }).formatToParts(new Date()); const get = type => parts.find(part => part.type === type)?.value || ""; return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} ${get("timeZoneName")}`; }
const versionConfig = JSON.parse(readRequiredFile("version.json"));
const appVersion = versionConfig.version;
if (typeof appVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(appVersion)) { console.error("Invalid version.json"); process.exit(1); }
const buildProfile = JSON.parse(readRequiredFile("build-profile.json"));
const experimentalFeatures = buildProfile.experimentalFeatures === true;
const buildChannel = buildProfile.channel;
if (!["stable", "test", "experimental"].includes(buildChannel) || experimentalFeatures !== (buildChannel === "experimental")) { console.error("Invalid build-profile.json"); process.exit(1); }
fs.mkdirSync(outputDir, { recursive: true });

// Marketing homepage at /. Keep the real screenshot, but give it the richer
// titanium/glass phone treatment from the original Frenano concept mock-up.
let home = readRequiredFile("home.html");
home = replaceRequiredSnippet(home, "url('/images/frenano-hero-background.jpg')", "url('/images/frenano-hero-background-web-full.webp')", "home.html");
const phonePolish = `
<style id="frenano-phone-polish-v2">
  .hero-shot { perspective:1550px; overflow:visible; }
  .iphone-frame {
    width:min(390px,100%);
    padding:11px;
    border-radius:68px;
    background:
      linear-gradient(103deg,rgba(255,255,255,.34),transparent 10% 82%,rgba(255,255,255,.24)),
      linear-gradient(145deg,#9ba1a8 0%,#343a41 8%,#0b0d10 26%,#020304 54%,#242a31 82%,#aab0b6 100%);
    box-shadow:
      0 68px 125px rgba(0,0,0,.68),
      0 24px 48px rgba(0,0,0,.62),
      -16px 8px 34px rgba(120,190,235,.10),
      0 0 0 1px rgba(255,255,255,.30),
      inset 0 0 0 1px rgba(255,255,255,.20),
      inset 6px 0 10px rgba(255,255,255,.08),
      inset -7px 0 12px rgba(0,0,0,.55);
    transform:rotateY(-7deg) rotateX(1.2deg) rotateZ(.65deg) translateZ(0);
    transform-style:preserve-3d;
  }
  .iphone-frame::before {
    inset:4px;
    border-radius:64px;
    border:1px solid rgba(255,255,255,.18);
    box-shadow:inset 0 0 0 1px rgba(0,0,0,.45);
  }
  .iphone-frame::after {
    content:"";
    position:absolute;
    pointer-events:none;
    z-index:4;
    left:8px;
    top:76px;
    bottom:80px;
    width:2px;
    border-radius:99px;
    background:linear-gradient(180deg,transparent,rgba(255,255,255,.42) 18%,rgba(255,255,255,.10) 78%,transparent);
    opacity:.8;
  }
  .iphone-screen {
    border-radius:56px;
    border:2px solid #050607;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.055),0 0 0 1px rgba(0,0,0,.82);
  }
  .iphone-screen img { border-radius:54px; }
  .dynamic-island { top:18px; width:112px; height:30px; box-shadow:0 0 0 1px rgba(255,255,255,.025); }
  .phone-side { width:4px; background:linear-gradient(180deg,#858b91,#33383e 30%,#6c7278 75%,#2e3338); box-shadow:0 1px 1px rgba(255,255,255,.25); }
  .phone-side.left { left:-1px; }
  .phone-side.right { right:-1px; }
  @media(max-width:900px) {
    .iphone-frame { width:min(325px,80vw); transform:rotateY(-2deg) rotateZ(.25deg); }
  }
  @media(max-width:700px) {
    .iphone-frame { width:min(292px,82vw); border-radius:56px; padding:9px; transform:none; }
    .iphone-frame::before { border-radius:52px; }
    .iphone-frame::after { display:none; }
    .iphone-screen { border-radius:48px; }
    .iphone-screen img { border-radius:46px; }
  }
</style>`;
if (!home.includes("</head>")) throw new Error("Homepage head not found");
home = home.replace("</head>", `${phonePolish}\n</head>`);
writeOutputFile("index.html", home);

// Actual Frenano web/PWA app at /app/
let html = readRequiredFile("index.template.html");
html = replaceAllRequired(html, "__GEOAPIFY_API_KEY__", key, "index.template.html");
html = replaceAllRequired(html, "__APP_VERSION__", appVersion, "index.template.html");
html = replaceRequiredSnippet(html, "Free forever. ", "", "index.template.html");
html = replaceRequiredSnippet(html,'        <div>Your journeys are your business.</div>','        <div>Your journeys are your business.</div>\n        <div style="margin-top:10px;"><a href="/privacy.html" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Privacy Policy</a></div>',"index.template.html");
html = applyStartupRobustnessFix(html, replaceRequiredSnippet);
html = applyRoadFreshnessFix(html, replaceRequiredSnippet);
html = injectSupportDiagnostics(html, { appVersion, buildChannel, experimentalFeatures });
html = applyHelpContactPrivacyFix(html, replaceRequiredSnippet, { appVersion, buildChannel });
html = applySettingsRedesign(html);
html = applySettingsPolish(html, { appVersion });
html = applyBrandRefresh(html);
html = applySimpleStartup(html);
html = applyRoadCardRefresh(html);
const buildTimeZurich = zurichBuildTime();
if (buildChannel !== "stable") {
  const markerTitle = buildChannel === "experimental" ? "EXPERIMENTAL VERSION" : "TEST VERSION";
  const channelIdentity = `\n  <style>\n    .build-channel-marker { position:fixed; top:max(8px,env(safe-area-inset-top)); left:50%; transform:translateX(-50%); z-index:10000; color:#ff9500; text-align:center; text-transform:uppercase; pointer-events:none; white-space:nowrap; }\n    .build-channel-name { font-size:12px; font-weight:900; letter-spacing:.12em; }\n    .build-channel-meta { margin-top:4px; font-size:9px; font-weight:720; letter-spacing:.05em; opacity:.70; text-transform:none; }\n    @media (orientation:portrait) { body.has-build-channel #app { padding-top:max(58px,calc(env(safe-area-inset-top) + 40px)); } }\n  </style>\n  <div class="build-channel-marker" aria-hidden="true">\n    <div class="build-channel-name">${markerTitle}</div>\n    <div class="build-channel-meta">v${appVersion} · built ${buildTimeZurich}</div>\n  </div>`;
  html = html.replace("</head>", `${channelIdentity.split('<div class=')[0]}</head>`);
  html = html.replace("<body>", `<body class="has-build-channel">${channelIdentity.slice(channelIdentity.indexOf('<div class='))}`);
}
if (experimentalFeatures) {
  html = replaceRequiredSnippet(html, `Version ${appVersion}`, `Version ${appVersion} · Experimental`, "index.template.html");
} else {
  html = replaceRequiredSnippet(html,'<div class="settings-section" data-settings-section="advanced-and-experimental-features">','<div class="settings-section hidden-element" data-settings-section="advanced-and-experimental-features" aria-hidden="true">',"index.template.html");
  html = replaceRequiredSnippet(html,'<div class="settings-section" data-settings-section="audio">','<div class="settings-section hidden-element" data-settings-section="audio" aria-hidden="true">',"index.template.html");
}
const releaseGuard = `(() => {\n  const EXPERIMENTAL_FEATURES = ${experimentalFeatures};\n  const BUILD_CHANNEL = ${JSON.stringify(buildChannel)};\n  if (!EXPERIMENTAL_FEATURES) {\n    ["experimentalMode", "transportDetectiveEnabled", "journeyModeEnabled", "visualTheme"].forEach(key => localStorage.removeItem(key));\n    const nativeFetch = window.fetch.bind(window);\n    window.fetch = (input, init) => {\n      const url = typeof input === "string" ? input : (input?.url || "");\n      if (String(url).includes("transport.opendata.ch")) return Promise.reject(new Error("Experimental transport API disabled in stable build"));\n      return nativeFetch(input, init);\n    };\n  }`;
html = replaceRequiredSnippet(html, "(() => {", releaseGuard, "index.template.html");
html = replaceRequiredSnippet(html,'experimentalMode: localStorage.getItem("experimentalMode") === "true",','experimentalMode: EXPERIMENTAL_FEATURES && localStorage.getItem("experimentalMode") === "true",',"index.template.html");
html = replaceRequiredSnippet(html,'transportDetectiveEnabled: localStorage.getItem("transportDetectiveEnabled") === "true",','transportDetectiveEnabled: EXPERIMENTAL_FEATURES && localStorage.getItem("transportDetectiveEnabled") === "true",',"index.template.html");
html = replaceRequiredSnippet(html,'journeyModeEnabled: localStorage.getItem("journeyModeEnabled") === "true",','journeyModeEnabled: EXPERIMENTAL_FEATURES && localStorage.getItem("journeyModeEnabled") === "true",',"index.template.html");
html = replaceRequiredSnippet(html,'visualTheme: localStorage.getItem("visualTheme") || "classic",','visualTheme: EXPERIMENTAL_FEATURES ? (localStorage.getItem("visualTheme") || "classic") : "classic",',"index.template.html");
html = replaceRequiredSnippet(html,'sounds: localStorage.getItem("limitSounds") === "true",','sounds: EXPERIMENTAL_FEATURES && localStorage.getItem("limitSounds") === "true",',"index.template.html");
html = replaceRequiredSnippet(html,'warning: localStorage.getItem("overspeedWarning") !== "false",','warning: EXPERIMENTAL_FEATURES && localStorage.getItem("overspeedWarning") !== "false",',"index.template.html");
html = replaceRequiredSnippet(html,'greetingAudio: localStorage.getItem("greetingAudio") !== "false",','greetingAudio: EXPERIMENTAL_FEATURES && localStorage.getItem("greetingAudio") !== "false",',"index.template.html");
writeOutputFile("app/index.html", html);

let sw = readRequiredFile("service-worker.js"); sw = replaceAllRequired(sw, "__APP_VERSION__", appVersion, "service-worker.js"); writeOutputFile("service-worker.js", sw);
for (const filename of ["manifest.webmanifest", "_headers", "privacy.html"]) { const src = path.join(rootDir, filename); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outputDir, filename)); }
for (const dir of ["audio", "images"]) { const src = path.join(rootDir, dir); if (fs.existsSync(src)) fs.cpSync(src, path.join(outputDir, dir), { recursive:true }); }
console.log(`Built Frenano v${appVersion} (${buildChannel}) successfully: homepage / and app /app/`);
