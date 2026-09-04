function applyBrandRefresh(html) {
  const brandRevision = "20260904-traced-approved-v1";
  const approvedMark = `brand/speedo-mark.svg?v=${brandRevision}`;
  const launchBefore = `    <div class="launch-ring">\n      <div class="launch-mark">Super Simple Speedo</div>\n    </div>`;
  const launchAfter = `    <div class="launch-brand" aria-label="Super Simple Speedo">\n      <div class="launch-brand-icon"><img class="launch-brand-mark" src="${approvedMark}" alt=""></div>\n      <div class="launch-brand-name"><span>Super Simple</span><strong>Speedo</strong></div>\n      <div class="launch-brand-tagline">GPS speedometer, simply done.</div>\n    </div>`;
  const runningBefore = `    <div class="app-title">Super Simple Speedo</div>`;
  const runningAfter = `    <div class="app-title app-brand-lockup" aria-label="Super Simple Speedo"><img class="app-brand-mark" src="${approvedMark}" alt=""><span class="app-brand-name"><span>Super Simple</span><strong>Speedo</strong></span></div>`;

  if (!html.includes(launchBefore)) throw new Error("Brand refresh: launch logo target not found");
  if (!html.includes(runningBefore)) throw new Error("Brand refresh: running logo target not found");

  html = html.replace(launchBefore, launchAfter);
  html = html.replace(runningBefore, runningAfter);

  const css = `\n<style id="brand-refresh-v8">\n  .launch-brand { display:grid; justify-items:center; gap:12px; margin:0 auto 24px; text-align:center; }\n  .launch-brand-icon { width:154px; display:grid; place-items:center; background:transparent; border:0; box-shadow:0 22px 58px rgba(0,0,0,.30); }\n  .launch-brand-mark { width:154px; height:auto; display:block; }\n  .launch-brand-name { margin-top:4px; display:grid; justify-items:center; gap:0; color:#fff; font-size:28px; line-height:.98; font-weight:780; letter-spacing:-.04em; }\n  .launch-brand-name strong { font-size:37px; font-weight:900; }\n  .launch-brand-tagline { margin-top:8px; max-width:300px; color:#a4a4a4; font-size:15px; line-height:1.35; font-weight:650; letter-spacing:-.01em; }\n\n  .app-title.app-brand-lockup { min-width:166px; min-height:52px; display:flex; align-items:center; gap:10px; opacity:1; visibility:visible; text-transform:none !important; letter-spacing:normal !important; }\n  .app-brand-mark { width:52px; height:52px; flex:0 0 52px; display:block; }\n  .app-brand-name { display:grid; gap:0; color:#fff; line-height:.92; letter-spacing:-.04em; text-transform:none !important; text-align:left; white-space:nowrap; }\n  .app-brand-name > span { font-size:17px; font-weight:760; }\n  .app-brand-name > strong { font-size:29px; font-weight:900; }\n  /* Keep the brand subtly present in driver mode by inheriting the header fade. */\n  body.driver-mode .app-title.app-brand-lockup { opacity:1; visibility:visible; transition:opacity .55s ease; }\n</style>`;
  if (!html.includes("</head>")) throw new Error("Brand refresh: document head not found");
  return html.replace("</head>", `${css}\n</head>`);
}

module.exports = { applyBrandRefresh };
