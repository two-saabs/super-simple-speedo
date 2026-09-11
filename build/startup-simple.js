function applySimpleStartup(html) {
  const clickTarget = `    if (button) {\n      button.disabled = true;\n      button.textContent = "Starting…";\n    }`;
  const clickReplacement = `${clickTarget}\n    window.__frenanoLocationIntroAccepted?.();`;

  if (!html.includes(clickTarget)) throw new Error("Simple startup: location button handler target not found");
  html = html.replace(clickTarget, clickReplacement);

  const launchStart = html.indexOf('<div class="launch-screen" id="launchScreen" aria-hidden="true">');
  const appStart = html.indexOf('<div id="app">', launchStart);
  if (launchStart < 0 || appStart < 0) throw new Error("Simple startup: launch screen block not found");

  const launchMarkup = `<div class="launch-screen frenano-location-intro" id="launchScreen" aria-hidden="false">
  <div class="location-intro-shade" aria-hidden="true"></div>
  <div class="location-intro-core">
    <div class="location-intro-brand" aria-label="Frenano">
      <img class="location-intro-logo" src="/images/frenano-startup-logo-512.png?v=20260911-frenano-location-v6" alt="">
      <div class="location-intro-name">Frenano</div>
      <div class="location-intro-tagline">GPS speedometer, simply done.</div>
    </div>

    <div class="location-intro-detail">
      <div class="location-intro-pin" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="M12 2.4 3.4 10.1c-.9.8-.4 2.3.8 2.5l5.1.8 1.1 6c.2 1.2 1.8 1.5 2.5.5l8.1-14.7c.7-1.3-.7-2.7-2-2.1L12 6.4V2.4Z"/></svg>
      </div>
      <h1>Location access<br>is needed</h1>
      <p class="location-intro-lead">Frenano uses your device’s GPS to calculate your speed and, where available, identify the road and speed limit.</p>
      <div class="location-intro-reasons">
        <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌁</div><div><strong>Accurate speed</strong><span>Calculated from GPS in real time.</span></div></div>
        <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌾</div><div><strong>Privacy focused</strong><span>No tracking, ads or location history.</span></div></div>
      </div>
    </div>

    <button class="launch-action location-enable-button" id="letsDriveButton" type="button">Let’s go!</button>
    <div class="location-intro-values"><span>Completely free · No account or subscription needed</span><br><span>No advertisements · Private · Made in Switzerland</span></div>

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

  const css = `
<style id="simple-startup-v4" data-flow="v5-smooth">
  .frenano-location-intro {
    place-items:center;
    overflow:hidden;
    color:#fff;
    background:#06182a url('/images/frenano-hero-background.jpg') center bottom/cover no-repeat;
    opacity:1;
    visibility:visible;
    transition:opacity .28s ease,visibility .28s ease;
  }
  .frenano-location-intro.hide { opacity:0; visibility:hidden; pointer-events:none; }
  .location-intro-shade { position:fixed; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(2,12,23,.80),rgba(4,20,36,.78) 50%,rgba(0,0,0,.28)); transition:opacity .28s ease; }
  .location-intro-core { position:relative; z-index:1; width:min(86vw,430px); min-height:100svh; margin:0 auto; padding:max(24px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom)); display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; }
  .location-intro-brand { display:grid; justify-items:center; gap:4px; transition:transform .30s ease,opacity .24s ease; }
  .location-intro-logo { width:108px; height:108px; object-fit:cover; border-radius:27px; box-shadow:0 16px 44px rgba(0,0,0,.32); transition:width .30s ease,height .30s ease,border-radius .30s ease; }
  .location-intro-name { margin-top:16px; font-size:32px; line-height:1; font-weight:900; letter-spacing:-.04em; }
  .location-intro-tagline { margin-top:8px; font-size:15px; line-height:1.3; font-weight:620; color:rgba(255,255,255,.65); }

  .location-intro-detail,.location-enable-button,.location-intro-values { display:none; }

  .frenano-location-intro.first-run { place-items:stretch; overflow:auto; -webkit-overflow-scrolling:touch; }
  .frenano-location-intro.first-run .location-intro-core { justify-content:flex-start; padding:max(58px,calc(env(safe-area-inset-top) + 44px)) 0 max(24px,env(safe-area-inset-bottom)); }
  .frenano-location-intro.first-run .location-intro-logo { width:76px; height:76px; border-radius:19px; }
  .frenano-location-intro.first-run .location-intro-name { margin-top:7px; font-size:30px; }
  .frenano-location-intro.first-run .location-intro-tagline { margin-top:5px; font-size:14px; }
  .frenano-location-intro.first-run .location-intro-detail { width:100%; display:flex; flex-direction:column; align-items:center; animation:frenanoReveal .24s ease both; }
  .frenano-location-intro.first-run .location-enable-button { display:block; width:100%; margin:22px 0 0; min-height:56px; background:linear-gradient(180deg,#279cff,#0b82ee); color:#fff; box-shadow:0 10px 28px rgba(0,92,200,.28); animation:frenanoReveal .24s ease both; }
  .frenano-location-intro.first-run .location-intro-values { display:block; margin-top:auto; max-width:410px; padding-top:18px; font-size:10px; line-height:1.55; font-weight:650; letter-spacing:.055em; color:rgba(255,255,255,.52); animation:frenanoReveal .24s ease both; }
  .location-intro-values span { white-space:nowrap; }
  .location-intro-pin { width:80px; height:80px; margin:18px auto 7px; border-radius:50%; display:grid; place-items:center; border:1px solid rgba(48,145,255,.24); box-shadow:0 0 0 18px rgba(48,145,255,.055); background:rgba(15,91,160,.10); }
  .location-intro-pin svg { width:43px; height:43px; fill:#1f8fff; transform:rotate(-8deg); filter:drop-shadow(0 0 15px rgba(31,143,255,.35)); }
  .location-intro-core h1 { margin:11px 0 0; font-size:clamp(34px,9.2vw,45px); line-height:1.04; letter-spacing:-.045em; font-weight:900; }
  .location-intro-lead { margin:14px auto 0; max-width:390px; font-size:clamp(16px,4.4vw,18px); line-height:1.4; font-weight:520; color:rgba(255,255,255,.74); }
  .location-intro-reasons { width:100%; margin:22px 0 0; display:grid; gap:14px; text-align:left; }
  .location-intro-reason { display:grid; grid-template-columns:48px 1fr; gap:13px; align-items:center; }
  .location-intro-icon { width:48px; height:48px; border-radius:50%; display:grid; place-items:center; background:rgba(14,73,124,.46); color:#1f8fff; font-size:25px; font-weight:900; line-height:1; border:1px solid rgba(94,166,227,.10); }
  .location-intro-reason strong { display:block; font-size:17px; line-height:1.2; font-weight:820; }
  .location-intro-reason span { display:block; margin-top:3px; font-size:14px; line-height:1.34; font-weight:510; color:rgba(255,255,255,.68); }

  .frenano-location-intro.returning .location-enable-button { display:block; width:min(310px,100%); margin-top:30px; min-height:56px; background:#fff; color:#000; box-shadow:none; }
  .frenano-location-intro.returning.returning-native .location-enable-button { display:none; }
  .frenano-location-intro.departing .location-intro-detail,.frenano-location-intro.departing .location-enable-button,.frenano-location-intro.departing .location-intro-values { opacity:0; pointer-events:none; }
  .frenano-location-intro.departing .location-intro-brand { transform:scale(1.015); }

  #launchSatelliteTrack,#launchChecklist,#launchDisclaimer,#launchStatus,#launchProgress { display:none !important; }
  @keyframes frenanoReveal { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }

  #settingsModal .sheet { position:relative; }
  #settingsModal h2 { padding-right:86px; }
  #settingsModal .settings-top-close { position:absolute; top:18px; right:18px; z-index:4; min-width:66px; min-height:38px; padding:0 14px; border:1px solid var(--soft-border); border-radius:12px; background:var(--soft); color:var(--fg); font-size:13px; font-weight:780; cursor:pointer; }

  @media (max-height:760px) {
    .frenano-location-intro.first-run .location-intro-core { padding-top:max(46px,calc(env(safe-area-inset-top) + 34px)); }
    .frenano-location-intro.first-run .location-intro-logo { width:62px; height:62px; border-radius:16px; }
    .frenano-location-intro.first-run .location-intro-name { font-size:26px; }
    .frenano-location-intro.first-run .location-intro-tagline { font-size:12px; }
    .location-intro-pin { width:64px; height:64px; margin-top:13px; box-shadow:0 0 0 14px rgba(48,145,255,.05); }
    .location-intro-pin svg { width:35px; height:35px; }
    .location-intro-core h1 { margin-top:8px; font-size:32px; }
    .location-intro-lead { margin-top:10px; font-size:14px; }
    .location-intro-reasons { margin-top:14px; gap:10px; }
    .location-intro-reason { grid-template-columns:42px 1fr; gap:11px; }
    .location-intro-icon { width:42px; height:42px; font-size:22px; }
    .location-intro-reason strong { font-size:15px; }
    .location-intro-reason span { font-size:12px; }
    .frenano-location-intro.first-run .location-enable-button { margin-top:14px; min-height:50px; }
    .frenano-location-intro.first-run .location-intro-values { padding-top:9px; font-size:9px; }
  }
  @media (prefers-reduced-motion:reduce) { .frenano-location-intro,.location-intro-brand { transition:none; } .frenano-location-intro.first-run .location-intro-detail,.frenano-location-intro.first-run .location-enable-button,.frenano-location-intro.first-run .location-intro-values { animation:none; } }
</style>`;

  const js = `
<script id="frenano-startup-flow-v5">
(() => {
  const KEY = 'frenanoLocationIntroSeenV1';
  const native = !!window.__SPEEDO_NATIVE_IOS__;
  if (native) document.body.classList.add('native-ios');
  const launch = document.getElementById('launchScreen');
  const sourceButton = document.getElementById('letsDriveButton');
  let exitTimer = 0;
  window.__frenanoLocationActionDone = false;

  function hideLaunch() {
    launch?.classList.add('hide');
    launch?.setAttribute('aria-hidden','true');
  }
  function beginExit() {
    if (!launch || launch.classList.contains('departing')) return;
    launch.classList.add('departing');
    window.clearTimeout(exitTimer);
    exitTimer = window.setTimeout(hideLaunch, 360);
  }
  function installSettingsClose() {
    const modal = document.getElementById('settingsModal');
    const sheet = modal?.querySelector('.sheet');
    if (!modal || !sheet || sheet.querySelector('.settings-top-close')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'settings-top-close';
    button.textContent = 'Close';
    button.setAttribute('aria-label','Close settings');
    button.addEventListener('click', () => document.getElementById('closeSettings')?.click());
    sheet.prepend(button);
  }

  window.__frenanoLocationIntroAccepted = () => {
    try { localStorage.setItem(KEY,'1'); } catch (_) {}
    window.__frenanoLocationActionDone = true;
    beginExit();
  };

  installSettingsClose();

  let seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (_) {}
  if (sourceButton) sourceButton.textContent = 'Let’s go!';

  if (seen) {
    launch?.classList.add('returning');
    if (native) launch?.classList.add('returning-native');
    if (native && sourceButton && !sourceButton.disabled) window.setTimeout(() => sourceButton.click(), 140);
  } else {
    launch?.classList.add('first-run');
  }
})();
</script>`;

  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Simple startup: document closing tags not found');
  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applySimpleStartup };
