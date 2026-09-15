'use strict';

function applySettingsRedesign(html, { appVersion }) {
  const css = `
<style id="settings-redesign-v2">
  #settingsModal .sheet { width:min(94vw,560px); max-height:min(90svh,860px); padding:18px 16px calc(20px + env(safe-area-inset-bottom)); border-radius:28px 28px 0 0; background:color-mix(in srgb,var(--panel) 96%,transparent); border:1px solid var(--soft-border); box-shadow:0 -18px 60px rgba(0,0,0,.36); backdrop-filter:blur(28px) saturate(1.15); -webkit-backdrop-filter:blur(28px) saturate(1.15); overflow-y:auto; }
  #settingsModal .grabber { width:42px; height:5px; margin:0 auto 14px; border-radius:999px; background:var(--fg); opacity:.16; }
  #settingsModal h2 { margin:2px 6px 18px; font-size:30px; line-height:1.05; font-weight:850; letter-spacing:-.035em; }
  #settingsModal .settings-section { margin:0; padding:18px 6px 20px; border:0; border-top:1px solid var(--soft-border); border-radius:0; overflow:visible; background:transparent; box-shadow:none; }
  #settingsModal .settings-section:first-of-type { border-top:0; padding-top:2px; }
  #settingsModal .settings-section-header { min-height:auto; padding:0 0 14px; border:0; background:transparent; display:block; width:100%; text-align:left; pointer-events:none; }
  #settingsModal .settings-section-header::before, #settingsModal .settings-section-chevron { display:none !important; }
  #settingsModal .settings-section-title { margin:0; padding:0; font-size:20px; line-height:1.2; font-weight:820; letter-spacing:-.018em; color:var(--fg); opacity:.98; }
  #settingsModal .settings-section-body { display:block !important; padding:0; }
  #settingsModal .setting { margin:0; padding:14px 0; min-height:0; border:0; }
  #settingsModal .setting + .setting { border-top:1px solid rgba(127,127,127,.14); }
  #settingsModal .setting-title { font-size:16px; font-weight:760; letter-spacing:-.01em; }
  #settingsModal .setting-note { font-size:13px; }
  #settingsModal .segmented { margin-top:10px; min-height:44px; padding:3px; border-radius:13px; background:rgba(127,127,127,.14); }
  #settingsModal .segment-button { min-height:38px; border-radius:10px; font-size:15px; font-weight:760; }
  #settingsModal .compact-choice-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:10px; }
  #settingsModal .compact-choice-list .choice-row { min-height:42px; padding:0 11px; margin:0; border:1px solid var(--soft-border); border-radius:12px; background:var(--soft); font-size:14px; }
  #settingsModal #elementChoices { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:9px; }
  #settingsModal #elementChoices .choice-row { min-height:40px; padding:0 10px; border-radius:11px; background:rgba(127,127,127,.08); font-size:13px; }
  #settingsModal #elementChoices input, #settingsModal .compact-choice-list input { width:18px; height:18px; }
  #settingsModal [data-settings-section="audio"], #settingsModal [data-settings-section="statistics"], #settingsModal [data-settings-section="advanced-and-experimental-features"] { display:none !important; }
  #settingsModal [data-settings-section="privacy"] .setting { padding:16px 0; }
  #settingsModal [data-settings-section="privacy"] .wide-button { min-height:44px; border-radius:12px; }
  body.light #settingsModal .sheet { box-shadow:0 -18px 60px rgba(0,0,0,.15); }
  @media (max-width:390px) { #settingsModal .sheet { width:100vw; padding-left:14px; padding-right:14px; } #settingsModal h2 { font-size:28px; margin-bottom:14px; } #settingsModal .settings-section { padding-left:2px; padding-right:2px; } }
</style>
<style id="settings-polish-v2">
  #settingsModal [data-settings-section="about"] { display:none !important; }
  #settingsModal .settings-section:not(.hidden-element) { margin:0 0 14px; padding:16px; border:1px solid var(--soft-border); border-radius:18px; background:rgba(127,127,127,.07); }
  #settingsModal .settings-section:not(.hidden-element) + .settings-section:not(.hidden-element) { margin-top:14px; }
  #settingsModal .settings-section-header { padding-bottom:12px !important; }
  #settingsModal .settings-section-title { font-size:19px !important; }
  #settingsModal .settings-section-body { padding:0 !important; }
  #settingsModal .settings-section .setting + .setting { border-top:1px solid rgba(127,127,127,.16); }
  #settingsModal .settings-footer { margin:18px 8px 4px; text-align:center; font-size:11px; line-height:1.55; font-weight:650; opacity:.38; }
  #settingsModal .settings-footer .version { display:block; margin-bottom:2px; }
  #settingsModal .location-permission-setting { padding-top:0 !important; }
  #settingsModal .location-permission-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; }
  #settingsModal .location-permission-status { display:flex; align-items:flex-start; gap:7px; margin-top:6px; font-size:13px; line-height:1.35; font-weight:720; opacity:.76; }
  #settingsModal .location-permission-dot { width:8px; height:8px; margin-top:5px; border-radius:50%; background:#8e8e93; flex:0 0 8px; }
  #settingsModal .location-permission-status.granted .location-permission-dot { background:#34c759; }
  #settingsModal .location-permission-status.denied .location-permission-dot { background:#ff9f0a; }
  #settingsModal .location-permission-action { min-width:96px; min-height:40px; padding:0 13px; border:0; border-radius:12px; background:var(--accent-soft); color:var(--fg); font-size:13px; font-weight:780; }
  #settingsModal .location-permission-help { display:none; margin-top:10px; font-size:12px; line-height:1.45; opacity:.62; }
  #settingsModal .location-permission-help.show { display:block; }
  #settingsModal [data-settings-section="privacy"] > .settings-section-body > div:first-child { padding-top:0 !important; }
  @media (max-width:390px) { #settingsModal .settings-section:not(.hidden-element) { padding:14px; border-radius:16px; } }
</style>`;

  const replacements = [
    ['<div class="setting-title">All-time private statistics</div>','<div class="setting-title">Keep private usage statistics</div>'],
    ['<div class="setting-note">Stored locally on this device and kept across app sessions until you reset them.</div>','<div class="setting-note">Stored only on this device. Never sent to us.</div>'],
    ['<div class="stat-card"><div class="stat-value" id="statDistance">0.0</div><div class="stat-label">Distance · km</div></div>','<div class="stat-card"><div class="stat-value" id="statDistance">0 m</div><div class="stat-label">Distance travelled</div></div>'],
    ['<div class="stat-card"><div class="stat-value" id="statHours">0.0</div><div class="stat-label">Time used · h</div></div>','<div class="stat-card"><div class="stat-value" id="statHours">0.0</div><div class="stat-label">Hours used</div></div>'],
    ['        </div>\n\n        <div class="data-usage-panel">','        </div>\n        <div class="stats-delight-grid">\n          <div class="stat-card"><div class="stat-value" id="statMaxSpeed">0</div><div class="stat-label">Fastest speed · km/h</div></div>\n          <div class="stat-card"><div class="stat-value" id="statRoadsIdentified">0</div><div class="stat-label">Roads identified</div></div>\n        </div>\n\n        <div class="data-usage-panel">'],
    ['<div class="data-usage-title">Very low data usage</div>','<div class="data-usage-title">Network usage</div>'],
    ['<div class="data-usage-summary">Road lookups use only a few kilobytes of data.</div>','<div class="data-usage-summary">Road lookups use very little mobile data.</div>'],
    ['<div class="data-usage-label">Used all time</div>','<div class="data-usage-label">Downloaded + uploaded</div>'],
    ['<div class="data-usage-label">Road lookups · all time</div>','<div class="data-usage-label">Road lookups</div>']
  ];
  for (const [before, after] of replacements) {
    if (!html.includes(before)) throw new Error(`Settings redesign: expected snippet not found: ${before.slice(0,80)}`);
    html = html.replace(before, after);
  }

  const js = `
<script id="settings-redesign-v2-script">
(() => {
  const APP_VERSION = ${JSON.stringify(appVersion)};
  let permissionStatus = 'unknown';
  let permissionObject = null;
  let gpsSucceeded = false;

  function updatePermissionAction() {
    const button = document.getElementById('locationPermissionAction');
    if (!button) return;
    if (!window.__SPEEDO_NATIVE_IOS__) { button.textContent = 'How to change'; return; }
    button.textContent = permissionStatus === 'denied' ? 'Open Settings' : 'Manage';
  }
  function setPermissionStatus(status) {
    permissionStatus = status || 'unknown';
    const row = document.getElementById('locationPermissionStatus');
    const label = document.getElementById('locationPermissionLabel');
    if (!row || !label) return;
    row.classList.remove('granted','denied');
    if (permissionStatus === 'granted') { row.classList.add('granted'); label.textContent = 'On — Frenano can use your location'; }
    else if (permissionStatus === 'denied') { row.classList.add('denied'); label.textContent = 'Off in Settings'; }
    else if (permissionStatus === 'prompt' || permissionStatus === 'prompt-with-rationale') label.textContent = 'Off — location is needed to measure your speed';
    else label.textContent = window.__SPEEDO_NATIVE_IOS__ ? 'Checking location…' : 'Check browser location settings';
    updatePermissionAction();
  }
  function markFromGeolocationError(error) { if (Number(error?.code) === 1) { gpsSucceeded = false; setPermissionStatus('denied'); } }
  function wrapWebGeolocation() {
    if (window.__SPEEDO_NATIVE_IOS__ || !navigator.geolocation || navigator.geolocation.__frenanoWrapped) return;
    const geo=navigator.geolocation, originalWatch=geo.watchPosition?.bind(geo), originalGet=geo.getCurrentPosition?.bind(geo);
    if (originalWatch) geo.watchPosition=(success,error,options)=>originalWatch(position=>{gpsSucceeded=true;setPermissionStatus('granted');success?.(position);},err=>{markFromGeolocationError(err);error?.(err);},options);
    if (originalGet) geo.getCurrentPosition=(success,error,options)=>originalGet(position=>{gpsSucceeded=true;setPermissionStatus('granted');success?.(position);},err=>{markFromGeolocationError(err);error?.(err);},options);
    try { Object.defineProperty(geo,'__frenanoWrapped',{value:true}); } catch (_) { geo.__frenanoWrapped=true; }
  }
  async function refreshPermissionStatus() {
    if (window.__SPEEDO_NATIVE_IOS__) { try { setPermissionStatus((await window.__SPEEDO_NATIVE_PERMISSIONS__?.refresh?.()) || 'unknown'); } catch (_) { setPermissionStatus('unknown'); } return; }
    if (gpsSucceeded) { setPermissionStatus('granted'); return; }
    if (!navigator.permissions?.query) { setPermissionStatus(permissionStatus === 'granted' ? 'granted' : 'unknown'); return; }
    try {
      permissionObject=permissionObject || await navigator.permissions.query({name:'geolocation'}); setPermissionStatus(permissionObject.state);
      if (!permissionObject.__frenanoWired) { permissionObject.addEventListener?.('change',()=>{if(permissionObject.state==='denied')gpsSucceeded=false;setPermissionStatus(gpsSucceeded?'granted':permissionObject.state);}); permissionObject.__frenanoWired=true; }
    } catch (_) { setPermissionStatus(permissionStatus === 'granted' ? 'granted' : 'unknown'); }
  }
  function locationHelpText() {
    const ua=navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'In Safari, open Website Settings for Frenano and choose Location. You can also review Safari location access in iPhone Settings.';
    if (/Android/i.test(ua)) return 'Open your browser’s site settings for Frenano and choose Location.';
    return 'Open your browser’s site permissions for Frenano and choose Location.';
  }
  function installLocationSetting() {
    const privacy=document.querySelector('#settingsModal [data-settings-section="privacy"]'), body=privacy?.querySelector('.settings-section-body'); if(!body)return;
    body.querySelectorAll('.location-setting, #nativeLocationPermissionSetting, #locationPermissionSetting').forEach(node=>node.remove());
    const native=!!window.__SPEEDO_NATIVE_IOS__, setting=document.createElement('div'); setting.className='setting location-permission-setting'; setting.id='locationPermissionSetting';
    setting.innerHTML='<div class="location-permission-row"><div><div class="setting-title" style="font-size:19px;">Location</div><div class="location-permission-status" id="locationPermissionStatus"><span class="location-permission-dot"></span><span id="locationPermissionLabel">Checking location…</span></div></div><button class="location-permission-action" id="locationPermissionAction" type="button">'+(native?'Manage':'How to change')+'</button></div><div class="location-permission-help" id="locationPermissionHelp">'+(native?'Location permission is controlled by iPhone Settings.':locationHelpText())+'</div>';
    body.prepend(setting);
    document.getElementById('locationPermissionAction')?.addEventListener('click',async()=>{if(native){await window.__SPEEDO_NATIVE_PERMISSIONS__?.openSettings?.();return;}document.getElementById('locationPermissionHelp')?.classList.toggle('show');}); refreshPermissionStatus();
  }
  function simplifyHelpCopy(modal) {
    modal.querySelectorAll('.setting-title').forEach(title=>{if(title.textContent.trim()==='Something not working?'){const note=title.parentElement?.querySelector('.setting-note');if(note)note.textContent='Share a privacy-safe diagnostic log to help us understand what happened.';}});
    const diagnostics=modal.querySelector('#supportDiagnosticsStatus'); if(diagnostics)diagnostics.textContent='Nothing is uploaded automatically.';
  }
  function decorateSettings() {
    const modal=document.getElementById('settingsModal'); if(!modal)return;
    const display=modal.querySelector('[data-settings-section="display"]'), title=display?.querySelector('.settings-section-title'); if(title)title.textContent='Appearance & Display';
    modal.querySelectorAll('.settings-section').forEach(section=>{section.classList.add('open');section.querySelector('.settings-section-header')?.setAttribute('aria-expanded','true');});
    const visible=display?.querySelector('.setting:nth-of-type(2)'); visible?.querySelector('.choice-list')?.classList.add('compact-choice-list'); visible?.querySelector('#elementChoices')?.classList.add('compact-choice-list');
    simplifyHelpCopy(modal); modal.querySelector('[data-settings-section="about"]')?.setAttribute('aria-hidden','true'); installLocationSetting();
    const sheet=modal.querySelector('.sheet'); let footer=sheet?.querySelector('.settings-footer');
    if(!footer&&sheet){modal.querySelector('.settings-redesign-note')?.remove();footer=document.createElement('div');footer.className = 'settings-footer';const versionText=window.__SPEEDO_NATIVE_IOS__?('Version 1.0 · Build '+APP_VERSION):('Version '+APP_VERSION);footer.innerHTML='<span class="version">'+versionText+'</span>Frenano · Made in Switzerland';sheet.appendChild(footer);} refreshPermissionStatus();
  }
  wrapWebGeolocation();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateSettings,{once:true});else decorateSettings();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshPermissionStatus();}); window.addEventListener('pageshow',refreshPermissionStatus);
})();
</script>`;
  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Settings redesign: expected HTML closing tags not found');
  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applySettingsRedesign };
