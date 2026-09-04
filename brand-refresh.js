function applyBrandRefresh(html) {
  const launchBefore = `    <div class="launch-ring">\n      <div class="launch-mark">Super Simple Speedo</div>\n    </div>`;
  const launchAfter = `    <div class="launch-brand" aria-label="Super Simple Speedo">\n      <div class="launch-brand-icon"><img class="launch-brand-mark" src="brand/speedo-mark.svg" alt=""></div>\n      <div class="launch-brand-name"><span>Super Simple</span><strong>Speedo</strong></div>\n      <div class="launch-brand-tagline">GPS speedometer, simply done.</div>\n    </div>`;
  const runningBefore = `    <div class="app-title">Super Simple Speedo</div>`;
  const runningAfter = `    <div class="app-title" aria-label="Super Simple Speedo"><img class="app-brand-mark" src="brand/speedo-mark.svg" alt=""></div>`;

  if (!html.includes(launchBefore)) throw new Error("Brand refresh: launch logo target not found");
  if (!html.includes(runningBefore)) throw new Error("Brand refresh: running logo target not found");

  html = html.replace(launchBefore, launchAfter);
  html = html.replace(runningBefore, runningAfter);

  const css = `\n<style id="brand-refresh-v1">\n  .launch-brand { display:grid; justify-items:center; gap:12px; margin:0 auto 24px; text-align:center; }\n  .launch-brand-icon { width:148px; height:148px; display:grid; place-items:center; overflow:hidden; border:1px solid #2a3238; border-radius:34px; background:#0b0f12; box-shadow:0 22px 58px rgba(0,0,0,.38); }\n  .launch-brand-mark { width:148px; height:148px; display:block; }\n  .launch-brand-name { margin-top:4px; display:grid; justify-items:center; gap:0; color:#fff; font-size:28px; line-height:.98; font-weight:780; letter-spacing:-.04em; }\n  .launch-brand-name strong { font-size:37px; font-weight:900; }\n  .launch-brand-tagline { margin-top:8px; max-width:300px; color:#a4a4a4; font-size:15px; line-height:1.35; font-weight:650; letter-spacing:-.01em; }\n  .app-title { min-width:48px; min-height:48px; display:flex; align-items:center; }\n  .app-brand-mark { width:46px; height:46px; display:block; border-radius:13px; box-shadow:0 8px 22px rgba(0,0,0,.18); }\n  body.driver-mode .app-title { opacity:0; visibility:hidden; transition:opacity .55s ease, visibility 0s linear .55s; }\n</style>`;
  if (!html.includes("</head>")) throw new Error("Brand refresh: document head not found");
  return html.replace("</head>", `${css}\n</head>`);
}

module.exports = { applyBrandRefresh };
