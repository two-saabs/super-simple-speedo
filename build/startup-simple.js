function applySimpleStartup(html) {
  const clickTarget = `    if (button) {\n      button.disabled = true;\n      button.textContent = "Starting…";\n    }`;
  const clickReplacement = `${clickTarget}\n    window.__frenanoLocationIntroAccepted?.();`;

  if (!html.includes(clickTarget)) {
    throw new Error("Simple startup: location button handler target not found");
  }
  html = html.replace(clickTarget, clickReplacement);

  const launchStart = html.indexOf('<div class="launch-screen" id="launchScreen" aria-hidden="true">');
  const appStart = html.indexOf('<div id="app">', launchStart);
  if (launchStart < 0 || appStart < 0) {
    throw new Error("Simple startup: launch screen block not found");
  }

  const launchMarkup = `<div class="launch-screen frenano-location-intro" id="launchScreen" aria-hidden="true">
  <div class="location-intro-shade" aria-hidden="true"></div>
  <div class="location-intro-core">
    <div class="location-intro-brand" aria-label="Frenano">
      <img class="location-intro-logo" src="/images/frenano-startup-logo-512.png?v=20260911-frenano-location-v4" alt="">
      <div class="location-intro-name">Frenano</div>
      <div class="location-intro-tagline">GPS speedometer, simply done.</div>
    </div>

    <div class="location-intro-pin" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false"><path d="M12 2.4 3.4 10.1c-.9.8-.4 2.3.8 2.5l5.1.8 1.1 6c.2 1.2 1.8 1.5 2.5.5l8.1-14.7c.7-1.3-.7-2.7-2-2.1L12 6.4V2.4Z"/></svg>
    </div>

    <h1>Location access<br>is needed</h1>
    <p class="location-intro-lead">Frenano is developed with<br>privacy and simplicity at its core.</p>

    <div class="location-intro-reasons">
      <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌁</div><div><strong>Accurate speed</strong><span>Calculated from GPS in real time.</span></div></div>
      <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌾</div><div><strong>Privacy focused</strong><span>No tracking, ads or location history.</span></div></div>
    </div>

    <p class="location-intro-permission">Frenano uses your location to calculate your speed<br>and, where available, show the local speed limit.</p>
    <p class="location-intro-guidance">When asked, allow location access for the best experience.<br><strong>“Allow While Using App”</strong> on iPhone.</p>

    <button class="launch-action location-enable-button" id="letsDriveButton" type="button">I’m OK with that</button>

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

<div class="frenano-ready-splash" id="frenanoReadySplash" aria-hidden="true">
  <div class="frenano-ready-core">
    <img class="frenano-ready-logo" src="/images/frenano-startup-logo-512.png?v=20260911-frenano-ready-v2" alt="Frenano">
    <div class="frenano-ready-name">Frenano</div>
    <div class="frenano-ready-tagline">GPS speedometer, simply done.</div>
    <button class="launch-action frenano-ready-button" id="frenanoReadyButton" type="button">Let’s go!</button>
  </div>
</div>

`;

  html = html.slice(0, launchStart) + launchMarkup + html.slice(appStart);

  const css = `
<style id="simple-startup-v3" data-flow="v4">
  .frenano-location-intro {
    place-items:stretch;
    overflow:auto;
    color:#fff;
    background:#06182a url('/images/frenano-hero-background.jpg') center bottom/cover no-repeat;
    -webkit-overflow-scrolling:touch;
  }
  .location-intro-shade { position:fixed; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(2,12,23,.80) 0%,rgba(4,20,36,.80) 48%,rgba(3,11,20,.40) 76%,rgba(0,0,0,.25) 100%); }
  .location-intro-core { position:relative; z-index:1; width:min(86vw,430px); min-height:100svh; margin:0 auto; padding:max(58px,calc(env(safe-area-inset-top) + 44px)) 0 max(24px,env(safe-area-inset-bottom)); display:flex; flex-direction:column; align-items:center; text-align:center; }
  .location-intro-brand { display:grid; justify-items:center; gap:4px; }
  .location-intro-logo { width:76px; height:76px; object-fit:cover; border-radius:19px; box-shadow:0 16px 44px rgba(0,0,0,.32); }
  .location-intro-name { margin-top:7px; font-size:30px; line-height:1; font-weight:900; letter-spacing:-.04em; }
  .location-intro-tagline { margin-top:5px; font-size:14px; line-height:1.3; font-weight:620; color:rgba(255,255,255,.65); }
  .location-intro-pin { width:80px; height:80px; margin:18px auto 7px; border-radius:50%; display:grid; place-items:center; border:1px solid rgba(48,145,255,.24); box-shadow:0 0 0 18px rgba(48,145,255,.055); background:rgba(15,91,160,.10); }
  .location-intro-pin svg { width:43px; height:43px; fill:#1f8fff; transform:rotate(-8deg); filter:drop-shadow(0 0 15px rgba(31,143,255,.35)); }
  .location-intro-core h1 { margin:11px 0 0; font-size:clamp(34px,9.2vw,45px); line-height:1.04; letter-spacing:-.045em; font-weight:900; }
  .location-intro-lead { margin:14px auto 0; max-width:390px; font-size:clamp(16px,4.4vw,18px); line-height:1.4; font-weight:520; color:rgba(255,255,255,.74); }
  .location-intro-reasons { width:100%; margin:22px 0 0; display:grid; gap:14px; text-align:left; }
  .location-intro-reason { display:grid; grid-template-columns:48px 1fr; gap:13px; align-items:center; }
  .location-intro-icon { width:48px; height:48px; border-radius:50%; display:grid; place-items:center; background:rgba(14,73,124,.46); color:#1f8fff; font-size:25px; font-weight:900; line-height:1; border:1px solid rgba(94,166,227,.10); }
  .location-intro-reason strong { display:block; font-size:17px; line-height:1.2; font-weight:820; }
  .location-intro-reason span { display:block; margin-top:3px; font-size:14px; line-height:1.34; font-weight:510; color:rgba(255,255,255,.68); }
  .location-intro-permission { width:100%; margin:18px 0 0; padding:12px 14px; border-radius:14px; background:rgba(4,18,32,.38); border:1px solid rgba(255,255,255,.11); font-size:13px; line-height:1.4; color:rgba(255,255,255,.75); }
  .location-intro-guidance { width:100%; margin:9px 0 0; font-size:12px; line-height:1.4; color:rgba(255,255,255,.70); }
  .location-intro-guidance strong { color:#fff; font-weight:800; }
  .location-enable-button { width:100%; margin:22px 0 0; min-height:56px; background:linear-gradient(180deg,#279cff,#0b82ee); color:#fff; box-shadow:0 10px 28px rgba(0,92,200,.28); }
  .location-intro-values { margin-top:auto; max-width:410px; padding-top:18px; font-size:10px; line-height:1.55; font-weight:650; letter-spacing:.055em; color:rgba(255,255,255,.52); }
  .location-intro-values span { white-space:nowrap; }
  #launchSatelliteTrack, #launchChecklist, #launchDisclaimer, #launchStatus, #launchProgress { display:none !important; }

  .frenano-ready-splash { position:fixed; inset:0; z-index:110; display:grid; place-items:center; background:#000; opacity:0; visibility:hidden; transition:opacity .28s ease,visibility .28s ease; color:#fff; }
  .frenano-ready-splash.show { opacity:1; visibility:visible; }
  .frenano-ready-core { width:min(78vw,360px); display:grid; justify-items:center; gap:0; text-align:center; }
  .frenano-ready-logo { width:112px; height:112px; border-radius:28px; object-fit:cover; box-shadow:0 18px 54px rgba(0,0,0,.45); }
  .frenano-ready-name { margin-top:18px; font-size:32px; line-height:1; font-weight:900; letter-spacing:-.04em; }
  .frenano-ready-tagline { margin-top:10px; font-size:15px; line-height:1.3; font-weight:620; color:rgba(255,255,255,.62); }
  .frenano-ready-button { width:min(310px,100%); margin:30px 0 0; background:#fff; color:#000; }
  body.native-ios .frenano-ready-button { display:none; }

  #settingsModal .sheet { position:relative; }
  #settingsModal h2 { padding-right:86px; }
  #settingsModal .settings-top-close { position:absolute; top:18px; right:18px; z-index:4; min-width:66px; min-height:38px; padding:0 14px; border:1px solid var(--soft-border); border-radius:12px; background:var(--soft); color:var(--fg); font-size:13px; font-weight:780; cursor:pointer; }
  #settingsModal .settings-top-close:active { transform:scale(.97); }

  @media (max-height:760px) {
    .location-intro-core { padding-top:max(46px,calc(env(safe-area-inset-top) + 34px)); }
    .location-intro-logo { width:62px; height:62px; border-radius:16px; }
    .location-intro-name { font-size:26px; }
    .location-intro-tagline { font-size:12px; }
    .location-intro-pin { width:64px; height:64px; margin-top:13px; box-shadow:0 0 0 14px rgba(48,145,255,.05); }
    .location-intro-pin svg { width:35px; height:35px; }
    .location-intro-core h1 { margin-top:8px; font-size:32px; }
    .location-intro-lead { margin-top:10px; font-size:14px; }
    .location-intro-reasons { margin-top:14px; gap:10px; }
    .location-intro-reason { grid-template-columns:42px 1fr; gap:11px; }
    .location-intro-icon { width:42px; height:42px; font-size:22px; }
    .location-intro-reason strong { font-size:15px; }
    .location-intro-reason span { font-size:12px; }
    .location-intro-permission { margin-top:10px; padding:9px 11px; font-size:11px; }
    .location-intro-guidance { margin-top:6px; font-size:10px; }
    .location-enable-button { margin-top:14px; min-height:50px; }
    .location-intro-values { padding-top:9px; font-size:9px; }
  }
  @media (prefers-reduced-motion:reduce) { .launch-screen,.frenano-ready-splash { transition:none; } }
</style>`;

  const js = `
<script id="frenano-startup-flow-v4">
(() => {
  const KEY = 'frenanoLocationIntroSeenV1';
  const native = !!window.__SPEEDO_NATIVE_IOS__;
  if (native) document.body.classList.add('native-ios');
  const launch = document.getElementById('launchScreen');
  const ready = document.getElementById('frenanoReadySplash');
  const sourceButton = document.getElementById('letsDriveButton');
  const readyButton = document.getElementById('frenanoReadyButton');
  let nativeHideScheduled = false;
  window.__frenanoLocationActionDone = false;

  function hideLaunch() {
    launch?.classList.add('hide');
    launch?.setAttribute('aria-hidden','true');
  }
  function hideReady() {
    ready?.classList.remove('show');
    ready?.setAttribute('aria-hidden','true');
  }
  function showReady() {
    hideLaunch();
    ready?.classList.add('show');
    ready?.setAttribute('aria-hidden','false');
    if (native) waitForNativePermissionThenFinish();
  }
  function waitForNativePermissionThenFinish() {
    if (nativeHideScheduled) return;
    nativeHideScheduled = true;
    let tries = 0;
    const check = async () => {
      tries += 1;
      let status = 'unknown';
      try { status = await window.__SPEEDO_NATIVE_PERMISSIONS__?.refresh?.() || 'unknown'; } catch (_) {}
      const settled = status === 'granted' || status === 'denied';
      const bridgeMissing = !window.__SPEEDO_NATIVE_PERMISSIONS__ && tries >= 10;
      if (settled || bridgeMissing || tries >= 140) {
        window.setTimeout(hideReady, 1500);
        return;
      }
      window.setTimeout(check, 150);
    };
    check();
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
    button.addEventListener('click', () => {
      const existing = document.getElementById('closeSettings');
      if (existing) existing.click();
      else {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden','true');
      }
    });
    sheet.prepend(button);
  }

  window.__frenanoLocationIntroAccepted = () => {
    try { localStorage.setItem(KEY,'1'); } catch (_) {}
    window.__frenanoLocationActionDone = true;
    showReady();
  };

  readyButton?.addEventListener('click', () => {
    if (!window.__frenanoLocationActionDone && sourceButton && !sourceButton.disabled) sourceButton.click();
    hideReady();
  });

  installSettingsClose();
  let seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (_) {}
  if (seen) {
    showReady();
    if (native && sourceButton && !sourceButton.disabled) window.setTimeout(() => sourceButton.click(), 0);
  } else {
    launch?.setAttribute('aria-hidden','false');
    if (sourceButton) sourceButton.textContent = native ? 'Continue' : 'I’m OK with that';
  }
})();
</script>`;

  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Simple startup: document closing tags not found');
  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applySimpleStartup };