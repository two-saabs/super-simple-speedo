'use strict';

function applyPositiveOnboarding(html) {
  const replacements = [
    ['<div class="location-intro-pin" aria-hidden="true">\n        <svg viewBox="0 0 24 24" focusable="false"><path d="M12 2.4 3.4 10.1c-.9.8-.4 2.3.8 2.5l5.1.8 1.1 6c.2 1.2 1.8 1.5 2.5.5l8.1-14.7c.7-1.3-.7-2.7-2-2.1L12 6.4V2.4Z"/></svg>\n      </div>\n      <h1>Location access<br>is needed</h1>\n      <p class="location-intro-lead">Frenano uses your device’s GPS to calculate your speed and, where available, identify the road and speed limit.</p>\n      <div class="location-intro-reasons">\n        <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌁</div><div><strong>Accurate speed</strong><span>Calculated from GPS in real time.</span></div></div>\n        <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌾</div><div><strong>Privacy focused</strong><span>No tracking, ads or location history.</span></div></div>\n      </div>',
     '<h1>Simple.<br>Private.<br>Swiss. <span class="swiss-mark" aria-label="Made in Switzerland">🇨🇭</span></h1>\n      <p class="location-intro-lead">Frenano is developed with<br>privacy and simplicity at its core.</p>\n      <div class="location-intro-promises" aria-label="Frenano promises">\n        <div class="location-intro-promise"><span class="location-intro-promise-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 12v8H4v-8M2.5 8h19v4h-19zM12 8v12M7.5 8C5.6 8 4.5 7.1 4.5 5.8S5.5 3.5 7 3.5c2.2 0 4 2.2 5 4.5M16.5 8c1.9 0 3-.9 3-2.2s-1-2.3-2.5-2.3c-2.2 0-4 2.2-5 4.5"/></svg></span><span class="location-intro-promise-copy"><strong>Completely free</strong><span>No costs. Ever.</span></span></div>\n        <div class="location-intro-promise"><span class="location-intro-promise-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 15l2.2-6h1.6l2.2 6M8 12h4M15 9v6M15 9h2.2a2 2 0 0 1 0 4H15M4 4l16 16"/></svg></span><span class="location-intro-promise-copy"><strong>No advertisements</strong><span>A clean, focused experience.</span></span></div>\n        <div class="location-intro-promise"><span class="location-intro-promise-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="3"/><path d="M4.5 19c.6-3.8 2.4-5.7 5.5-5.7 1.6 0 2.9.5 3.8 1.4M3 3l18 18"/></svg></span><span class="location-intro-promise-copy"><strong>No account or<br>subscription needed</strong><span>Just open and go.</span></span></div>\n        <div class="location-intro-promise"><span class="location-intro-promise-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 19 9.2 8l3 5 2.1-3.2L21 19H3Z"/><path d="m7.7 10.7 1.5 1.5 1.4-1.7 1.6 2.5"/></svg></span><span class="location-intro-promise-copy"><strong>Made in Switzerland</strong><span>Simple by design.</span></span></div>\n      </div>\n      <p class="location-intro-permission">Respecting and staying within the speed limit is<br>always the responsibility of the driver.</p>\n      <p class="location-intro-guidance">When asked, allow location access for the best experience.<br><strong>(“Allow While Using App”</strong> on iPhone).</p>'],
    ['<div class="location-intro-values"><span>Completely free · No account or subscription needed</span><br><span>No advertisements · Private · Made in Switzerland</span></div>',
     '']
  ];
  for (const [before, after] of replacements) {
    if (!html.includes(before)) throw new Error('Positive onboarding: expected startup copy not found');
    html = html.replace(before, after);
  }

  const css = `<style id="positive-onboarding-v5">
  .frenano-location-intro.first-run .location-intro-detail { margin-top:18px; align-items:center; text-align:center; }
  .frenano-location-intro.first-run .location-intro-core h1 { margin:12px 0 0; font-size:clamp(42px,11vw,54px); line-height:.96; text-align:center; align-self:center; letter-spacing:-.055em; }
  .swiss-mark { font-size:.58em; vertical-align:.08em; }
  .frenano-location-intro.first-run .location-intro-lead { margin:14px auto 0; max-width:390px; text-align:center; align-self:center; font-size:16px; }
  .location-intro-promises { width:100%; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px 16px; margin-top:20px; text-align:left; }
  .location-intro-promise { min-height:68px; padding:10px 0; border-top:1px solid rgba(255,255,255,.16); display:grid; grid-template-columns:36px minmax(0,1fr); gap:10px; align-items:start; }
  .location-intro-promise-icon { width:34px; height:34px; margin-top:1px; display:grid; place-items:center; color:#fff; opacity:.92; }
  .location-intro-promise-icon svg { width:31px; height:31px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
  .location-intro-promise-copy { min-width:0; }
  .location-intro-promise strong { display:block; font-size:14px; line-height:1.18; font-weight:820; }
  .location-intro-promise-copy > span { display:block; margin-top:4px; font-size:11px; line-height:1.3; color:rgba(255,255,255,.62); }
  .location-intro-permission { width:100%; margin:18px 0 0; padding:13px 15px; border-radius:14px; background:rgba(4,18,32,.38); border:1px solid rgba(255,255,255,.11); font-size:13px; line-height:1.4; text-align:center; color:rgba(255,255,255,.75); }
  .location-intro-guidance { width:100%; margin:12px 0 0; font-size:12px; line-height:1.4; text-align:center; color:rgba(255,255,255,.68); }
  .location-intro-guidance strong { color:#fff; font-weight:800; }
  @media(max-height:760px){ .frenano-location-intro.first-run .location-intro-detail{margin-top:10px}.frenano-location-intro.first-run .location-intro-core h1{font-size:38px}.location-intro-promises{margin-top:12px;gap:6px 14px}.location-intro-promise{min-height:58px;padding:7px 0;grid-template-columns:31px minmax(0,1fr);gap:8px}.location-intro-promise-icon{width:29px;height:29px}.location-intro-promise-icon svg{width:27px;height:27px}.location-intro-promise strong{font-size:13px}.location-intro-promise-copy>span{font-size:10px}.location-intro-permission{margin-top:10px;padding:10px 12px}.location-intro-guidance{margin-top:8px;font-size:11px}.frenano-location-intro.first-run .location-enable-button{margin-top:10px} }
  </style>`;

  const js = `<script id="ios-location-state-refresh-v1">
  (()=>{
    async function syncNativeLocationRow(){
      if(!window.__SPEEDO_NATIVE_IOS__) return;
      let status='unknown';
      try{ status=(await window.__SPEEDO_NATIVE_PERMISSIONS__?.refresh?.())||'unknown'; }catch(_){}
      const row=document.getElementById('locationPermissionStatus');
      const label=document.getElementById('locationPermissionLabel');
      if(!row||!label)return;
      row.classList.remove('granted','denied');
      if(status==='granted'){row.classList.add('granted');label.textContent='On — Frenano can use your location';}
      else if(status==='denied'){row.classList.add('denied');label.textContent='Off in Settings';}
      else if(status==='prompt'||status==='prompt-with-rationale'){label.textContent='Off — location is needed to measure your speed';}
      else label.textContent='Checking location…';
    }
    const settings=document.getElementById('settingsButton')||document.querySelector('[data-open-settings]');
    settings?.addEventListener('click',()=>{syncNativeLocationRow();setTimeout(syncNativeLocationRow,180);});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){syncNativeLocationRow();setTimeout(syncNativeLocationRow,180);}});
    window.addEventListener('focus',()=>setTimeout(syncNativeLocationRow,80));
  })();
  </script>`;
  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applyPositiveOnboarding };
