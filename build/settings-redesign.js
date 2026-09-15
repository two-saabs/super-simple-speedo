function applySettingsRedesign(html) {
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
  #settingsModal .location-setting { padding:0 0 18px; border:0; }
  #settingsModal .location-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; min-height:54px; }
  #settingsModal .location-state { display:inline-flex; align-items:center; gap:7px; margin-top:5px; font-size:13px; font-weight:700; opacity:.66; }
  #settingsModal .location-dot { width:8px; height:8px; border-radius:50%; background:#8e8e93; }
  #settingsModal .location-state.granted .location-dot { background:#34c759; }
  #settingsModal .location-state.denied .location-dot { background:#ff9f0a; }
  #settingsModal .manage-location { min-width:84px; min-height:38px; padding:0 13px; border:0; border-radius:11px; background:var(--accent-soft); color:var(--fg); font-size:13px; font-weight:760; }
  #settingsModal .location-help { display:none; margin-top:9px; font-size:12px; line-height:1.45; opacity:.58; }
  #settingsModal .location-help.show { display:block; }
  #settingsModal [data-settings-section="about"] .setting > div { padding-top:0 !important; padding-bottom:0 !important; }
  #settingsModal [data-settings-section="about"] .setting > div > div:nth-child(n+3) { display:none; }
  #settingsModal [data-settings-section="about"] .setting > div > div:first-child { font-size:17px !important; }
  #settingsModal [data-settings-section="about"] .setting > div > div:nth-child(2) { margin-top:5px !important; font-size:13px; }
  #settingsModal [data-settings-section="audio"], #settingsModal [data-settings-section="statistics"], #settingsModal [data-settings-section="advanced-and-experimental-features"] { display:none !important; }
  #settingsModal [data-settings-section="privacy"] .setting { padding:16px 0; }
  #settingsModal [data-settings-section="privacy"] .setting:first-child { padding-top:0; }
  #settingsModal [data-settings-section="privacy"] .wide-button { min-height:44px; border-radius:12px; }
  #settingsModal .settings-redesign-note { margin:8px 8px 2px; text-align:center; font-size:11px; font-weight:650; letter-spacing:.02em; opacity:.34; }
  body.light #settingsModal .sheet { box-shadow:0 -18px 60px rgba(0,0,0,.15); }
  @media (max-width:390px) { #settingsModal .sheet { width:100vw; padding-left:14px; padding-right:14px; } #settingsModal h2 { font-size:28px; margin-bottom:14px; } #settingsModal .settings-section { padding-left:2px; padding-right:2px; } }
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
  const unitKey = 'speedUnits';
  const currentUnits = () => localStorage.getItem(unitKey) === 'mph' ? 'mph' : 'kmh';
  const asDisplay = kmh => currentUnits() === 'mph' ? Math.round(Number(kmh) * 0.621371) : Math.round(Number(kmh));
  function updateUnitsUi() {
    const mph = currentUnits() === 'mph';
    document.getElementById('unitKmhButton')?.classList.toggle('active', !mph);
    document.getElementById('unitMphButton')?.classList.toggle('active', mph);
    const unit = document.querySelector('.speed-dial-core .unit');
    if (unit) unit.textContent = mph ? 'mph' : 'km/h';
    const speed = document.getElementById('speed');
    if (speed?.dataset.kmh !== undefined && speed.dataset.kmh !== '') speed.textContent = String(asDisplay(speed.dataset.kmh));
    const limit = document.getElementById('limit');
    if (limit?.dataset.kmh) limit.textContent = String(asDisplay(limit.dataset.kmh));
    document.querySelectorAll('#limitGrid .limit-choice[data-limit]').forEach(button => { const raw=Number(button.dataset.limit); if (Number.isFinite(raw)) button.textContent=String(asDisplay(raw)); });
    window.dispatchEvent(new Event('resize'));
  }
  function installUnitsSetting(displaySection) {
    const body = displaySection?.querySelector('.settings-section-body');
    const visible = body?.querySelector('.setting:nth-of-type(2)');
    if (!body || !visible || document.getElementById('unitKmhButton')) return;
    const units=document.createElement('div'); units.className='setting';
    units.innerHTML='<div class="setting-title">Units</div><div class="segmented"><button class="segment-button" id="unitKmhButton" type="button">km/h</button><button class="segment-button" id="unitMphButton" type="button">mph</button></div>';
    body.insertBefore(units, visible);
    document.getElementById('unitKmhButton').addEventListener('click',()=>{localStorage.setItem(unitKey,'kmh');updateUnitsUi();});
    document.getElementById('unitMphButton').addEventListener('click',()=>{localStorage.setItem(unitKey,'mph');updateUnitsUi();});
  }
  function decorateSettings() {
    const modal=document.getElementById('settingsModal'); if(!modal)return;
    const display=modal.querySelector('[data-settings-section="display"]');
    const title=display?.querySelector('.settings-section-title'); if(title) title.textContent='Appearance & Display';
    modal.querySelectorAll('.settings-section').forEach(section=>{section.classList.add('open');section.querySelector('.settings-section-header')?.setAttribute('aria-expanded','true');});
    const visible=display?.querySelector('.setting:nth-of-type(2)');
    visible?.querySelector('.choice-list')?.classList.add('compact-choice-list');
    visible?.querySelector('#elementChoices')?.classList.add('compact-choice-list');
    installUnitsSetting(display);
    const sheet=modal.querySelector('.sheet');
    if(sheet&&!sheet.querySelector('.settings-redesign-note')){const note=document.createElement('div');note.className='settings-redesign-note';note.textContent='Frenano · Made in Switzerland';sheet.appendChild(note);}
    updateUnitsUi();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateSettings,{once:true});else decorateSettings();
})();
</script>`;
  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Settings redesign: expected HTML closing tags not found');
  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applySettingsRedesign };
