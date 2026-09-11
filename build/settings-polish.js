'use strict';

function applySettingsPolish(html, { appVersion }) {
  const css = `
<style id="settings-polish-v1">
  #settingsModal [data-settings-section="about"] { display:none !important; }
  #settingsModal .settings-section:not(.hidden-element) {
    margin:0 0 14px; padding:16px; border:1px solid var(--soft-border); border-radius:18px;
    background:rgba(127,127,127,.07);
  }
  #settingsModal .settings-section:not(.hidden-element) + .settings-section:not(.hidden-element) { margin-top:14px; }
  #settingsModal .settings-section-header { padding-bottom:12px !important; }
  #settingsModal .settings-section-title { font-size:19px !important; }
  #settingsModal .settings-section-body { padding:0 !important; }
  #settingsModal .settings-section .setting + .setting { border-top:1px solid rgba(127,127,127,.16); }
  #settingsModal .settings-footer { margin:18px 8px 4px; text-align:center; font-size:11px; line-height:1.55; font-weight:650; opacity:.38; }
  #settingsModal .settings-footer .version { display:block; margin-bottom:2px; }
  #settingsModal .location-permission-setting { padding-top:0 !important; }
  #settingsModal .location-permission-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; }
  #settingsModal .location-permission-status { display:flex; align-items:center; gap:7px; margin-top:6px; font-size:13px; font-weight:720; opacity:.72; }
  #settingsModal .location-permission-dot { width:8px; height:8px; border-radius:50%; background:#8e8e93; flex:0 0 8px; }
  #settingsModal .location-permission-status.granted .location-permission-dot { background:#34c759; }
  #settingsModal .location-permission-status.denied .location-permission-dot { background:#ff9f0a; }
  #settingsModal .location-permission-action { min-width:96px; min-height:40px; padding:0 13px; border:0; border-radius:12px; background:var(--accent-soft); color:var(--fg); font-size:13px; font-weight:780; }
  #settingsModal .location-permission-help { display:none; margin-top:10px; font-size:12px; line-height:1.45; opacity:.62; }
  #settingsModal .location-permission-help.show { display:block; }
  #settingsModal [data-settings-section="privacy"] > .settings-section-body > div:first-child { padding-top:0 !important; }
  @media (max-width:390px) { #settingsModal .settings-section:not(.hidden-element) { padding:14px; border-radius:16px; } }
</style>`;

  const js = `
<script id="settings-polish-v1-script">
(() => {
  const APP_VERSION = ${JSON.stringify(appVersion)};
  let permissionStatus = 'unknown';
  let permissionObject = null;

  function setPermissionStatus(status) {
    permissionStatus = status || 'unknown';
    const row = document.getElementById('locationPermissionStatus');
    const label = document.getElementById('locationPermissionLabel');
    if (!row || !label) return;
    row.classList.remove('granted','denied');
    const native = !!window.__SPEEDO_NATIVE_IOS__;
    if (permissionStatus === 'granted') { row.classList.add('granted'); label.textContent = 'Allowed'; }
    else if (permissionStatus === 'denied') { row.classList.add('denied'); label.textContent = 'Not allowed'; }
    else if (permissionStatus === 'prompt' || permissionStatus === 'prompt-with-rationale') label.textContent = native ? 'Ask next time' : 'Not yet requested';
    else label.textContent = native ? 'Checking…' : 'Check browser settings';
  }

  function markFromGeolocationError(error) { if (Number(error?.code) === 1) setPermissionStatus('denied'); }

  function wrapWebGeolocation() {
    if (window.__SPEEDO_NATIVE_IOS__ || !navigator.geolocation || navigator.geolocation.__frenanoWrapped) return;
    const geo = navigator.geolocation;
    const originalWatch = geo.watchPosition?.bind(geo);
    const originalGet = geo.getCurrentPosition?.bind(geo);
    if (originalWatch) geo.watchPosition = (success,error,options) => originalWatch(position => { setPermissionStatus('granted'); success?.(position); }, err => { markFromGeolocationError(err); error?.(err); }, options);
    if (originalGet) geo.getCurrentPosition = (success,error,options) => originalGet(position => { setPermissionStatus('granted'); success?.(position); }, err => { markFromGeolocationError(err); error?.(err); }, options);
    try { Object.defineProperty(geo, '__frenanoWrapped', { value:true }); } catch (_) { geo.__frenanoWrapped = true; }
  }

  async function refreshPermissionStatus() {
    if (window.__SPEEDO_NATIVE_IOS__) {
      try { setPermissionStatus((await window.__SPEEDO_NATIVE_PERMISSIONS__?.refresh?.()) || 'unknown'); }
      catch (_) { setPermissionStatus('unknown'); }
      return;
    }
    if (!navigator.permissions?.query) { setPermissionStatus(permissionStatus === 'granted' ? 'granted' : 'unknown'); return; }
    try {
      permissionObject = permissionObject || await navigator.permissions.query({ name:'geolocation' });
      setPermissionStatus(permissionObject.state);
      if (!permissionObject.__frenanoWired) {
        permissionObject.addEventListener?.('change', () => setPermissionStatus(permissionObject.state));
        permissionObject.__frenanoWired = true;
      }
    } catch (_) { setPermissionStatus(permissionStatus === 'granted' ? 'granted' : 'unknown'); }
  }

  function locationHelpText() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'In Safari, open Website Settings for Frenano and choose Location. You can also review Safari location access in iPhone Settings.';
    if (/Android/i.test(ua)) return 'Open your browser’s site settings for Frenano and choose Location.';
    return 'Open your browser’s site permissions for Frenano and choose Location.';
  }

  function installLocationSetting() {
    const privacy = document.querySelector('#settingsModal [data-settings-section="privacy"]');
    const body = privacy?.querySelector('.settings-section-body');
    if (!body || document.getElementById('locationPermissionSetting')) return;
    document.getElementById('nativeLocationPermissionSetting')?.remove();
    const native = !!window.__SPEEDO_NATIVE_IOS__;
    const setting = document.createElement('div');
    setting.className = 'setting location-permission-setting';
    setting.id = 'locationPermissionSetting';
    setting.innerHTML = '<div class="location-permission-row"><div><div class="setting-title" style="font-size:19px;">Location access</div><div class="location-permission-status" id="locationPermissionStatus"><span class="location-permission-dot"></span><span id="locationPermissionLabel">Checking…</span></div></div><button class="location-permission-action" id="locationPermissionAction" type="button">' + (native ? 'Manage' : 'How to change') + '</button></div><div class="location-permission-help" id="locationPermissionHelp">' + (native ? 'Location permission is controlled by iPhone Settings.' : locationHelpText()) + '</div>';
    body.prepend(setting);
    document.getElementById('locationPermissionAction')?.addEventListener('click', async () => {
      if (native) { await window.__SPEEDO_NATIVE_PERMISSIONS__?.openSettings?.(); return; }
      document.getElementById('locationPermissionHelp')?.classList.toggle('show');
    });
    refreshPermissionStatus();
  }

  function polishSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.querySelectorAll('.setting-title').forEach(title => { if (title.textContent.trim() === 'Need help?') title.textContent = 'Feedback?'; });
    modal.querySelector('[data-settings-section="about"]')?.setAttribute('aria-hidden','true');
    installLocationSetting();
    const sheet = modal.querySelector('.sheet');
    let footer = sheet?.querySelector('.settings-footer');
    if (!footer && sheet) {
      modal.querySelector('.settings-redesign-note')?.remove();
      footer = document.createElement('div');
      footer.className = 'settings-footer';
      const versionText = window.__SPEEDO_NATIVE_IOS__ ? ('Version 1.0 · Build ' + APP_VERSION) : ('Version ' + APP_VERSION);
      footer.innerHTML = '<span class="version">' + versionText + '</span>Frenano · Made in Switzerland';
      sheet.appendChild(footer);
    }
    refreshPermissionStatus();
  }

  wrapWebGeolocation();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polishSettings, { once:true }); else polishSettings();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshPermissionStatus(); });
  window.addEventListener('pageshow', refreshPermissionStatus);
})();
</script>`;

  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Settings polish: document closing tags not found');
  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applySettingsPolish };
