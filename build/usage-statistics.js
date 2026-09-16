function applyUsageStatistics(html) {
  const replacements = [
    ['stats: loadJsonObject("speedoStats", { trips: 0, milliseconds: 0, metres: 0, apiBytes: 0, apiRequests: 0, apiResponses: 0, apiResponseBytes: 0 }),','stats: loadJsonObject("speedoStats", { trips: 0, milliseconds: 0, metres: 0, apiBytes: 0, apiRequests: 0, apiResponses: 0, apiResponseBytes: 0, maxSpeed: 0, roadsIdentified: 0 }),'],
    ['    $("statDistance").textContent = formatStat(state.stats.metres / 1000, 1);','    const metres = Math.max(0, Number(state.stats.metres) || 0);\n    $("statDistance").textContent = metres < 1000 ? `${Math.round(metres)} m` : `${formatStat(metres / 1000, 1)} km`;'],
    ['    $("statHours").textContent = formatStat((state.stats.milliseconds + liveMs) / 3600000, 1);','    $("statHours").textContent = formatStat((state.stats.milliseconds + liveMs) / 3600000, 1);\n    $("statMaxSpeed").textContent = formatStat(state.stats.maxSpeed || 0);\n    $("statRoadsIdentified").textContent = formatStat(state.stats.roadsIdentified || 0);'],
    ['    state.lastAcceptedSpeed = speedResult.acceptedKmh;', '    state.lastAcceptedSpeed = speedResult.acceptedKmh;\n    if ((decision === "ACCEPTED" || decision === "ACCEPTED_CONFIRMED") &&\n        state.statisticsEnabled && speedResult.acceptedKmh > (state.stats.maxSpeed || 0)) {\n      state.stats.maxSpeed = Math.round(speedResult.acceptedKmh);\n      saveStats();\n    }'],
    ['      if (roadOutcome === "CONFIRMED" && acceptedLimit !== null) {','      if (roadOutcome === "CONFIRMED" && acceptedLimit !== null) {\n        if (state.statisticsEnabled && acceptedRoad && previousConfirmedRoad !== acceptedRoad) {\n          state.stats.roadsIdentified = (state.stats.roadsIdentified || 0) + 1;\n          saveStats();\n        }'],
    ['    state.stats = { trips: 0, milliseconds: 0, metres: 0, apiBytes: 0, apiRequests: 0, apiResponses: 0, apiResponseBytes: 0 };','    state.stats = { trips: 0, milliseconds: 0, metres: 0, apiBytes: 0, apiRequests: 0, apiResponses: 0, apiResponseBytes: 0, maxSpeed: 0, roadsIdentified: 0 };']
  ];

  for (const [before, after] of replacements) {
    if (!html.includes(before)) throw new Error(`Usage statistics: expected snippet not found: ${before.slice(0,80)}`);
    html = html.replace(before, after);
  }
  return html;
}

module.exports = { applyUsageStatistics };
