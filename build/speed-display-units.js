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
  return html;
}

module.exports = { applySpeedDisplayUnits };
