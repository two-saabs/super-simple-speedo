'use strict';

function applyPositiveOnboarding(html) {
  const replacements = [
    ['<div class="location-intro-pin" aria-hidden="true">\n        <svg viewBox="0 0 24 24" focusable="false"><path d="M12 2.4 3.4 10.1c-.9.8-.4 2.3.8 2.5l5.1.8 1.1 6c.2 1.2 1.8 1.5 2.5.5l8.1-14.7c.7-1.3-.7-2.7-2-2.1L12 6.4V2.4Z"/></svg>\n      </div>\n      <h1>Location access<br>is needed</h1>\n      <p class="location-intro-lead">Frenano uses your device’s GPS to calculate your speed and, where available, identify the road and speed limit.</p>\n      <div class="location-intro-reasons">\n        <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌁</div><div><strong>Accurate speed</strong><span>Calculated from GPS in real time.</span></div></div>\n        <div class="location-intro-reason"><div class="location-intro-icon" aria-hidden="true">⌾</div><div><strong>Privacy focused</strong><span>No tracking, ads or location history.</span></div></div>\n      </div>',
     '<h1>Simple.<br>Private.<br>Swiss. <span class="swiss-mark" aria-label="Made in Switzerland">🇨🇭</span></h1>\n      <p class="location-intro-lead">Frenano is developed with<br>privacy and simplicity at its core.</p>\n      <div class="location-intro-promises" aria-label="Frenano promises">\n        <div><strong>Real-time speed</strong><span>Calculated from GPS.</span></div>\n        <div><strong>Local speed limits</strong><span>Where available.</span></div>\n        <div><strong>No tracking. No ads.</strong><span>No account needed.</span></div>\n        <div><strong>Made in Switzerland</strong><span>Simple by design.</span></div>\n      </div>\n      <p class="location-intro-permission">Frenano uses your location to calculate your speed<br>and, where available, show the local speed limit.</p>\n      <p class="location-intro-choice">When asked, allow location access for the best experience.<br><strong>“Allow While Using App”</strong> on iPhone.</p>'],
    ['<div class="location-intro-values"><span>Completely free · No account or subscription needed</span><br><span>No advertisements · Private · Made in Switzerland</span></div>',
     '<div class="location-intro-values"><span>Completely free · No accounts or subscriptions</span><br><span>No advertising · Private · Made in Switzerland</span></div>']
  ];
  for (const [before, after] of replacements) {
    if (!html.includes(before)) throw new Error('Positive onboarding: expected startup copy not found');
    html = html.replace(before, after);
  }

  const css = `<style id="positive-onboarding-v1">
  .frenano-location-intro.first-run .location-intro-detail { margin-top:18px; }
  .frenano-location-intro.first-run .location-intro-core h1 { margin:12px 0 0; font-size:clamp(42px,11vw,54px); line-height:.96; text-align:left; align-self:flex-start; letter-spacing:-.055em; }
  .swiss-mark { font-size:.58em; vertical-align:.08em; }
  .frenano-location-intro.first-run .location-intro-lead { margin:14px 0 0; max-width:390px; text-align:left; align-self:flex-start; font-size:16px; }
  .location-intro-promises { width:100%; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px 16px; margin-top:20px; text-align:left; }
  .location-intro-promises div { padding:10px 0; border-top:1px solid rgba(255,255,255,.16); }
  .location-intro-promises strong { display:block; font-size:14px; line-height:1.2; font-weight:820; }
  .location-intro-promises span { display:block; margin-top:3px; font-size:11px; line-height:1.3; color:rgba(255,255,255,.62); }
  .location-intro-permission { margin:18px 0 0; padding:13px 15px; border-radius:14px; background:rgba(4,18,32,.38); border:1px solid rgba(255,255,255,.11); font-size:13px; line-height:1.4; text-align:left; color:rgba(255,255,255,.75); }
  .location-intro-choice { margin:9px 2px 0; font-size:12px; line-height:1.35; text-align:left; color:rgba(255,255,255,.72); }
  .location-intro-choice strong { color:rgba(255,255,255,.92); font-weight:760; }
  @media(max-height:760px){ .frenano-location-intro.first-run .location-intro-detail{margin-top:10px}.frenano-location-intro.first-run .location-intro-core h1{font-size:38px}.location-intro-promises{margin-top:12px;gap:6px 14px}.location-intro-promises div{padding:7px 0}.location-intro-permission{margin-top:10px;padding:10px 12px}.location-intro-choice{margin-top:6px;font-size:11px}.frenano-location-intro.first-run .location-enable-button{margin-top:10px} }
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
