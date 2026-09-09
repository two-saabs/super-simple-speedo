function applyBrandRefresh(html) {
  const brandRevision = "20260909-frenano-v1";
  const approvedMark = `/images/frenano-website-icon-512.png?v=${brandRevision}`;
  const launchBefore = `    <div class="launch-ring">\n      <div class="launch-mark">Super Simple Speedo</div>\n    </div>`;
  const launchAfter = `    <div class="launch-brand" aria-label="Frenano">\n      <div class="launch-brand-icon"><img class="launch-brand-mark" src="${approvedMark}" alt=""></div>\n      <div class="launch-brand-name"><strong>Frenano</strong></div>\n      <div class="launch-brand-tagline">GPS speedometer, simply done.</div>\n    </div>`;
  const runningBefore = `    <div class="app-title">Super Simple Speedo</div>`;
  const runningAfter = `    <div class="app-title app-brand-lockup" aria-label="Frenano"><img class="app-brand-mark" src="${approvedMark}" alt=""><span class="app-brand-name"><strong>Frenano</strong></span></div>`;

  if (!html.includes(launchBefore)) throw new Error("Brand refresh: launch logo target not found");
  if (!html.includes(runningBefore)) throw new Error("Brand refresh: running logo target not found");

  html = html.replace(launchBefore, launchAfter);
  html = html.replace(runningBefore, runningAfter);

  const oldTitle = '<title>Super Simple Speedo</title>';
  const newMetadata = '<title>Frenano — GPS speedometer, simply done.</title>\n  <meta name="description" content="Frenano is a simple GPS speedometer with automatic local speed-limit information where available. Free. Simple. Private. Made in Switzerland.">\n  <meta name="apple-mobile-web-app-title" content="Frenano">';
  if (!html.includes(oldTitle)) throw new Error("Brand refresh: document title target not found");
  html = html.replace(oldTitle, newMetadata);

  const css = `\n<style id="brand-refresh-v9">\n  .launch-brand { display:grid; justify-items:center; gap:12px; margin:0 auto 24px; text-align:center; }\n  .launch-brand-icon { width:154px; display:grid; place-items:center; background:transparent; border:0; box-shadow:0 22px 58px rgba(0,0,0,.30); border-radius:34px; overflow:hidden; }\n  .launch-brand-mark { width:154px; height:154px; object-fit:cover; display:block; }\n  .launch-brand-name { margin-top:4px; display:grid; justify-items:center; gap:0; color:#fff; font-size:28px; line-height:.98; font-weight:780; letter-spacing:-.04em; }\n  .launch-brand-name strong { font-size:37px; font-weight:900; }\n  .launch-brand-tagline { margin-top:8px; max-width:300px; color:#a4a4a4; font-size:15px; line-height:1.35; font-weight:650; letter-spacing:-.01em; }\n\n  .app-title.app-brand-lockup { min-width:166px; min-height:52px; display:flex; align-items:center; gap:10px; opacity:1; visibility:visible; text-transform:none !important; letter-spacing:normal !important; }\n  .app-brand-mark { width:52px; height:52px; flex:0 0 52px; object-fit:cover; display:block; border-radius:13px; }\n  .app-brand-name { display:grid; gap:0; color:#fff; line-height:.92; letter-spacing:-.04em; text-transform:none !important; text-align:left; white-space:nowrap; }\n  .app-brand-name > strong { font-size:29px; font-weight:900; }\n  body.driver-mode .app-title.app-brand-lockup { opacity:1; visibility:visible; transition:opacity .55s ease; }\n</style>`;
  if (!html.includes("</head>")) throw new Error("Brand refresh: document head not found");
  return html.replace("</head>", `${css}\n</head>`);
}

module.exports = { applyBrandRefresh };
