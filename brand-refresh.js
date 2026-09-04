function applyBrandRefresh(html) {
  const launchBefore = `    <div class="launch-ring">\n      <div class="launch-mark">Super Simple Speedo</div>\n    </div>`;
  const launchAfter = `    <div class="launch-brand" aria-label="Super Simple Speedo">\n      <img class="launch-brand-mark" src="brand/speedo-mark.svg" alt="">\n      <div class="launch-brand-name"><span>Super Simple</span><strong>Speedo</strong></div>\n      <div class="launch-brand-tagline">GPS speedometer, simply done.</div>\n    </div>`;
  const runningBefore = `    <div class="app-title">Super Simple Speedo</div>`;
  const runningAfter = `    <div class="app-title" aria-label="Super Simple Speedo"><img class="app-brand-mark" src="brand/speedo-mark.svg" alt=""></div>`;

  if (!html.includes(launchBefore)) throw new Error("Brand refresh: launch logo target not found");
  if (!html.includes(runningBefore)) throw new Error("Brand refresh: running logo target not found");

  html = html.replace(launchBefore, launchAfter);
  html = html.replace(runningBefore, runningAfter);

  const css = `\n<style id="brand-refresh-v1">\n  .launch-brand { display:grid; justify-items:center; gap:10px; margin:0 auto 24px; }\n  .launch-brand-mark { width:126px; height:126px; display:block; border-radius:28px; box-shadow:0 18px 48px rgba(0,0,0,.30); }\n  .launch-brand-name { margin-top:2px; display:grid; gap:0; font-size:25px; line-height:.98; font-weight:760; letter-spacing:-.035em; }\n  .launch-brand-name strong { font-size:32px; font-weight:880; }\n  .launch-brand-tagline { max-width:250px; font-size:13px; line-height:1.35; font-weight:650; opacity:.52; }\n  .app-title { min-width:48px; min-height:48px; display:flex; align-items:center; }\n  .app-brand-mark { width:46px; height:46px; display:block; border-radius:13px; box-shadow:0 8px 22px rgba(0,0,0,.18); }\n  body.driver-mode .app-title { opacity:0; visibility:hidden; transition:opacity .55s ease, visibility 0s linear .55s; }\n</style>`;
  if (!html.includes("</head>")) throw new Error("Brand refresh: document head not found");
  return html.replace("</head>", `${css}\n</head>`);
}

module.exports = { applyBrandRefresh };
