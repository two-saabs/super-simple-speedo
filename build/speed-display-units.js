function applySpeedDisplayUnits(html) {
  const replacements = [
    ['    const shown = Math.max(0, Math.round(state.displayedSpeed));\n    if (speedEl.textContent !== String(shown)) {\n      speedEl.textContent = shown;', '    const shown = Math.max(0, Math.round(state.displayedSpeed));\n    const shownForDisplay = localStorage.getItem("speedUnits") === "mph" ? Math.round(shown * 0.621371) : shown;\n    speedEl.dataset.kmh = String(shown);\n    if (speedEl.textContent !== String(shownForDisplay)) {\n      speedEl.textContent = shownForDisplay;'],
    ['    limitEl.textContent = nextLimit ?? "?";', '    limitEl.dataset.kmh = nextLimit === null ? "" : String(nextLimit);\n    limitEl.textContent = nextLimit === null ? "?" : String(localStorage.getItem("speedUnits") === "mph" ? Math.round(nextLimit * 0.621371) : nextLimit);'],
    ['    if (shownSpeed <= 160) return 160;\n    return Math.min(240, Math.ceil(shownSpeed / 20) * 20);', '    const mphMode = localStorage.getItem("speedUnits") === "mph";\n    const base = mphMode ? 160.9344 : 160;\n    const step = mphMode ? 32.18688 : 20;\n    if (shownSpeed <= base) return base;\n    return Math.min(mphMode ? 241.4016 : 240, Math.ceil(shownSpeed / step) * step);'],
    ['    const values = [];\n    for (let value = 0; value <= maximum + 0.001; value += 10) values.push(value);', '    const values = [];\n    const mphMode = localStorage.getItem("speedUnits") === "mph";\n    const tickStep = mphMode ? 16.09344 : 10;\n    for (let value = 0; value <= maximum + 0.001; value += tickStep) values.push(value);'],
    ['        text.textContent = String(Math.round(value));', '        text.textContent = String(Math.round(localStorage.getItem("speedUnits") === "mph" ? value * 0.621371 : value));']
  ];

  for (const [before, after] of replacements) {
    if (!html.includes(before)) throw new Error(`Speed display units: expected snippet not found: ${before.slice(0,80)}`);
    html = html.replace(before, after);
  }

  const js = `
<script id="speed-display-units-script">
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
  function installUnitsSetting() {
    const displaySection = document.querySelector('#settingsModal [data-settings-section="display"]');
    const body = displaySection?.querySelector('.settings-section-body');
    const visible = body?.querySelector('.setting:nth-of-type(2)');
    if (!body || !visible || document.getElementById('unitKmhButton')) return;
    const units=document.createElement('div'); units.className='setting';
    units.innerHTML='<div class="setting-title">Units</div><div class="segmented"><button class="segment-button" id="unitKmhButton" type="button">km/h</button><button class="segment-button" id="unitMphButton" type="button">mph</button></div>';
    body.insertBefore(units, visible);
    document.getElementById('unitKmhButton').addEventListener('click',()=>{localStorage.setItem(unitKey,'kmh');updateUnitsUi();});
    document.getElementById('unitMphButton').addEventListener('click',()=>{localStorage.setItem(unitKey,'mph');updateUnitsUi();});
    updateUnitsUi();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installUnitsSetting,{once:true});else installUnitsSetting();
})();
</script>`;
  if (!html.includes('</body>')) throw new Error('Speed display units: expected HTML closing body tag not found');
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applySpeedDisplayUnits };
