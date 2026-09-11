function applySimpleStartup(html) {
  const clickTarget = `    if (button) {\n      button.disabled = true;\n      button.textContent = "Starting…";\n    }`;
  const clickReplacement = `${clickTarget}\n    // Reveal the speedometer as soon as the user deliberately enables location.\n    const launchScreen = $("launchScreen");\n    if (launchScreen) {\n      launchScreen.classList.add("hide");\n      launchScreen.setAttribute("aria-hidden", "true");\n    }`;

  if (!html.includes(clickTarget)) {
    throw new Error("Simple startup: location button handler target not found");
  }
  html = html.replace(clickTarget, clickReplacement);

  // Brand refresh runs before this transform, so the test intro can use Frenano's
  // real launch artwork rather than a generated/mock logo.
  const launchStart = html.indexOf('<div class="launch-screen" id="launchScreen" aria-hidden="true">');
  const appStart = html.indexOf('<div id="app">', launchStart);
  if (launchStart < 0 || appStart < 0) {
    throw new Error("Simple startup: launch screen block not found");
  }

  const launchMarkup = `<div class="launch-screen frenano-location-intro" id="launchScreen" aria-hidden="true">
  <div class="location-intro-shade" aria-hidden="true"></div>
  <div class="location-intro-core">
    <div class="location-intro-brand" aria-label="Frenano">
      <img class="location-intro-logo" src="/images/frenano-startup-logo-512.png?v=20260909-frenano-v3" alt="">
      <div class="location-intro-name">Frenano</div>
      <div class="location-intro-tagline">GPS speedometer, simply done.</div>
    </div>

    <div class="location-intro-pin" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 2.4 3.4 10.1c-.9.8-.4 2.3.8 2.5l5.1.8 1.1 6c.2 1.2 1.8 1.5 2.5.5l8.1-14.7c.7-1.3-.7-2.7-2-2.1L12 6.4V2.4Z"/>
      </svg>
    </div>

    <h1>Location access<br>is needed</h1>
    <p class="location-intro-lead">Frenano uses your device’s GPS to calculate your speed and, where available, identify the road and speed limit.</p>

    <div class="location-intro-reasons">
      <div class="location-intro-reason">
        <div class="location-intro-icon" aria-hidden="true">⌁</div>
        <div><strong>Accurate speed</strong><span>Your speed is calculated from GPS data in real time.</span></div>
      </div>
      <div class="location-intro-reason">
        <div class="location-intro-icon road-icon" aria-hidden="true">▮▮</div>
        <div><strong>Road and speed limit</strong><span>We use your location to find the road you’re on and show the speed limit where available.</span></div>
      </div>
      <div class="location-intro-reason">
        <div class="location-intro-icon" aria-hidden="true">⌾</div>
        <div><strong>Your privacy matters</strong><span>Your location is only used to provide speed and road information. We do not track you, show ads, or share your data.</span></div>
      </div>
    </div>

    <button class="launch-action location-enable-button" id="letsDriveButton" type="button">Enable Location</button>
    <button class="location-not-now" type="button" onclick="document.getElementById('launchScreen')?.classList.add('hide'); document.getElementById('launchScreen')?.setAttribute('aria-hidden','true');">Not Now</button>

    <div class="location-intro-values">FREE · SIMPLE · PRIVATE</div>
    <div class="launch-status" id="launchStatus" aria-hidden="true"></div>
    <div class="launch-progress" aria-hidden="true"><span id="launchProgress"></span></div>
    <div class="launch-checklist hidden" id="launchChecklist" aria-hidden="true">
      <div class="launch-step" id="launchStepStart"></div>
      <div class="launch-step" id="launchStepLocation"></div>
      <div class="launch-step hidden" id="launchStepTransit"></div>
      <div class="launch-step" id="launchStepReady"></div>
    </div>
    <div id="launchSatelliteTrack" class="hidden" aria-hidden="true"></div>
    <div id="launchDisclaimer" class="hidden" aria-hidden="true"></div>
  </div>
</div>

`;

  html = html.slice(0, launchStart) + launchMarkup + html.slice(appStart);

  const css = `\n<style id="simple-startup-v2">\n  .frenano-location-intro {\n    place-items:stretch;\n    overflow:auto;\n    color:#fff;\n    background:#06182a url('/images/frenano-hero-background.jpg') center bottom/cover no-repeat;\n    -webkit-overflow-scrolling:touch;\n  }\n  .location-intro-shade {\n    position:fixed; inset:0; pointer-events:none;\n    background:linear-gradient(180deg,rgba(2,12,23,.80) 0%,rgba(4,20,36,.80) 48%,rgba(3,11,20,.40) 76%,rgba(0,0,0,.25) 100%);\n  }\n  .location-intro-core {\n    position:relative; z-index:1;\n    width:min(86vw,430px);\n    min-height:100svh;\n    margin:0 auto;\n    padding:max(72px,calc(env(safe-area-inset-top) + 58px)) 0 max(30px,env(safe-area-inset-bottom));\n    display:flex; flex-direction:column; align-items:center;\n    text-align:center;\n  }\n  .location-intro-brand { display:grid; justify-items:center; gap:4px; }\n  .location-intro-logo { width:82px; height:82px; object-fit:cover; border-radius:20px; box-shadow:0 16px 44px rgba(0,0,0,.32); }\n  .location-intro-name { margin-top:8px; font-size:31px; line-height:1; font-weight:900; letter-spacing:-.04em; }\n  .location-intro-tagline { margin-top:5px; font-size:14px; line-height:1.3; font-weight:620; color:rgba(255,255,255,.65); }\n  .location-intro-pin {\n    width:92px; height:92px; margin:22px auto 10px; border-radius:50%;\n    display:grid; place-items:center;\n    border:1px solid rgba(48,145,255,.24);\n    box-shadow:0 0 0 22px rgba(48,145,255,.055);\n    background:rgba(15,91,160,.10);\n  }\n  .location-intro-pin svg { width:48px; height:48px; fill:#1f8fff; transform:rotate(-8deg); filter:drop-shadow(0 0 15px rgba(31,143,255,.35)); }\n  .location-intro-core h1 { margin:14px 0 0; font-size:clamp(34px,9.2vw,46px); line-height:1.04; letter-spacing:-.045em; font-weight:900; }\n  .location-intro-lead { margin:17px auto 0; max-width:390px; font-size:clamp(16px,4.5vw,19px); line-height:1.42; font-weight:520; color:rgba(255,255,255,.74); }\n  .location-intro-reasons { width:100%; margin:26px 0 0; display:grid; gap:18px; text-align:left; }\n  .location-intro-reason { display:grid; grid-template-columns:52px 1fr; gap:15px; align-items:start; }\n  .location-intro-icon {\n    width:52px; height:52px; border-radius:50%; display:grid; place-items:center;\n    background:rgba(14,73,124,.46); color:#1f8fff; font-size:27px; font-weight:900; line-height:1;\n    border:1px solid rgba(94,166,227,.10);\n  }\n  .location-intro-icon.road-icon { font-size:17px; letter-spacing:5px; padding-left:5px; color:#fff; }\n  .location-intro-reason strong { display:block; font-size:18px; line-height:1.2; font-weight:820; }\n  .location-intro-reason span { display:block; margin-top:4px; font-size:15px; line-height:1.36; font-weight:510; color:rgba(255,255,255,.68); }\n  .location-enable-button {\n    width:100%; margin:26px 0 0; min-height:58px;\n    background:linear-gradient(180deg,#279cff,#0b82ee); color:#fff;\n    box-shadow:0 10px 28px rgba(0,92,200,.28);\n  }\n  .location-not-now {\n    margin:12px 0 0; padding:8px 20px; border:0; background:transparent; color:#2695ff;\n    font-size:17px; font-weight:700; cursor:pointer;\n  }\n  .location-intro-values { margin-top:auto; padding-top:24px; font-size:11px; font-weight:700; letter-spacing:.32em; color:rgba(255,255,255,.50); }\n  #launchSatelliteTrack, #launchChecklist, #launchDisclaimer, #launchStatus, #launchProgress { display:none !important; }\n\n  @media (max-height:760px) {\n    .location-intro-core { padding-top:max(54px,calc(env(safe-area-inset-top) + 42px)); }\n    .location-intro-logo { width:66px; height:66px; border-radius:17px; }\n    .location-intro-name { font-size:27px; }\n    .location-intro-tagline { font-size:12px; }\n    .location-intro-pin { width:70px; height:70px; margin-top:16px; box-shadow:0 0 0 16px rgba(48,145,255,.05); }\n    .location-intro-pin svg { width:38px; height:38px; }\n    .location-intro-core h1 { margin-top:10px; font-size:34px; }\n    .location-intro-lead { margin-top:12px; font-size:15px; }\n    .location-intro-reasons { margin-top:18px; gap:12px; }\n    .location-intro-reason { grid-template-columns:44px 1fr; gap:12px; }\n    .location-intro-icon { width:44px; height:44px; font-size:23px; }\n    .location-intro-reason strong { font-size:16px; }\n    .location-intro-reason span { font-size:13px; }\n    .location-enable-button { margin-top:18px; min-height:52px; }\n    .location-intro-values { padding-top:12px; }\n  }\n\n  @media (orientation:landscape) and (max-height:560px) {\n    .location-intro-core { width:min(92vw,760px); padding:36px 0 22px; display:grid; grid-template-columns:220px 1fr; column-gap:34px; align-content:center; text-align:left; }\n    .location-intro-brand, .location-intro-pin { display:none; }\n    .location-intro-core h1, .location-intro-lead, .location-intro-reasons, .location-enable-button, .location-not-now, .location-intro-values { grid-column:2; }\n    .location-intro-core h1 { margin:0; }\n    .location-intro-reasons { margin-top:16px; gap:9px; }\n    .location-intro-reason { grid-template-columns:40px 1fr; gap:10px; }\n    .location-intro-icon { width:40px; height:40px; }\n    .location-enable-button { margin-top:14px; }\n    .location-intro-values { margin-top:8px; padding-top:0; }\n  }\n\n  @media (prefers-reduced-motion:reduce) {\n    .launch-screen { transition:none; }\n  }\n</style>`;

  if (!html.includes("</head>")) throw new Error("Simple startup: document head not found");
  return html.replace("</head>", `${css}\n</head>`);
}

module.exports = { applySimpleStartup };
