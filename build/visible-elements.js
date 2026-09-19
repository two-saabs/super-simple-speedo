'use strict';

function replaceRequired(html, before, after, label) {
  if (!html.includes(before)) throw new Error(`Visible elements: expected ${label} snippet not found`);
  return html.replace(before, after);
}

function applyVisibleElements(html) {
  html = replaceRequired(
    html,
    '<svg class="speed-dial-svg" viewBox="0 0 320 320" aria-hidden="true" focusable="false">',
    '<svg class="speed-dial-svg" id="speedDialArtwork" viewBox="0 0 320 320" aria-hidden="true" focusable="false">',
    'dial artwork'
  );
  html = replaceRequired(
    html,
    '<div class="speed-dial-core">',
    '<div class="speed-dial-core" id="speedDigital">',
    'digital speed core'
  );
  html = replaceRequired(
    html,
    '<div class="lower">\n        <button id="limitButton"',
    '<div class="lower" id="speedLimitSection">\n        <button id="limitButton"',
    'complete speed-limit section'
  );

  const oldControls = `      <div class="choice-list">\n        <label class="choice-row"><input type="radio" name="viewMode" value="all" id="viewAll">View all</label>\n        <label class="choice-row"><input type="radio" name="viewMode" value="custom" id="viewCustom">Choose elements</label>\n      </div>\n      <div class="choice-list" id="elementChoices">\n        <label class="choice-row"><input type="checkbox" id="showSpeedo">Speedo</label>\n        <label class="choice-row"><input type="checkbox" id="showDial">Dial</label>\n        <label class="choice-row"><input type="checkbox" id="showLimit">Speed limit</label>\n        <label class="choice-row"><input type="checkbox" id="showGps">GPS status</label>\n      </div>`;
  const newControls = `      <div class="choice-list" id="elementChoices">\n        <label class="choice-row"><input type="checkbox" id="showSpeedo">Speed (Digital)</label>\n        <label class="choice-row"><input type="checkbox" id="showDial">Speed (Dial)</label>\n        <label class="choice-row"><input type="checkbox" id="showLimit">Speed limit</label>\n      </div>`;
  html = replaceRequired(html, oldControls, newControls, 'visibility controls');

  html = replaceRequired(html, '    viewMode: localStorage.getItem("speedoViewMode") || "all",\n', '', 'legacy view mode state');
  html = replaceRequired(html, '    showGps: localStorage.getItem("showGps") !== "false",\n', '', 'legacy GPS visibility state');

  const oldApply = `  function applyVisibility() {\n    const all = state.viewMode === "all";\n    $("viewAll").checked = all;\n    $("viewCustom").checked = !all;\n    $("elementChoices").style.opacity = all ? ".45" : "1";\n    $("elementChoices").style.pointerEvents = all ? "none" : "auto";\n    $("showSpeedo").checked = state.showSpeedo;\n    $("showDial").checked = state.showDial;\n    $("showLimit").checked = state.showLimit;\n    $("showGps").checked = state.showGps;\n    document.body.classList.toggle("dial-display", all || state.showDial);\n    $("speedSection").classList.toggle("hidden-element", !all && !state.showSpeedo);\n    $("limitButton").classList.toggle("hidden-element", !all && !state.showLimit);\n    // While moving, road name/source remain visible as evidence for the shown limit,\n    // even when optional GPS diagnostics are hidden in the user's custom view.\n    const keepRoadEvidence = state.driverModeActive;\n    $("gpsSection").classList.toggle("hidden-element", !keepRoadEvidence && !all && !state.showGps);\n  }\n\n  function saveVisibility() {\n    localStorage.setItem("speedoViewMode", state.viewMode);\n    localStorage.setItem("showSpeedo", String(state.showSpeedo));\n    localStorage.setItem("showDial", String(state.showDial));\n    localStorage.setItem("showLimit", String(state.showLimit));\n    localStorage.setItem("showGps", String(state.showGps));\n    applyVisibility();\n  }`;
  const newApply = `  function applyVisibility() {\n    $("showSpeedo").checked = state.showSpeedo;\n    $("showDial").checked = state.showDial;\n    $("showLimit").checked = state.showLimit;\n    document.body.classList.toggle("dial-display", state.showDial);\n    $("speedDigital").classList.toggle("hidden-element", !state.showSpeedo);\n    $("speedDialArtwork").classList.toggle("hidden-element", !state.showDial);\n    $("speedLimitSection").classList.toggle("hidden-element", !state.showLimit);\n  }\n\n  function saveVisibility() {\n    localStorage.setItem("showSpeedo", String(state.showSpeedo));\n    localStorage.setItem("showDial", String(state.showDial));\n    localStorage.setItem("showLimit", String(state.showLimit));\n    // Remove obsolete visibility preferences from older Frenano builds.\n    localStorage.removeItem("speedoViewMode");\n    localStorage.removeItem("showGps");\n    applyVisibility();\n  }`;
  html = replaceRequired(html, oldApply, newApply, 'visibility runtime');

  const oldListeners = `  document.querySelectorAll('input[name="viewMode"]').forEach(input => {\n    input.addEventListener("change", () => {\n      state.viewMode = input.value;\n      saveVisibility();\n    });\n  });\n\n  $("showSpeedo").addEventListener("change", e => {`;
  html = replaceRequired(html, oldListeners, '  $("showSpeedo").addEventListener("change", e => {', 'legacy view-mode listeners');
  html = replaceRequired(
    html,
    `  $("showGps").addEventListener("change", e => {\n    state.showGps = e.target.checked;\n    saveVisibility();\n  });\n\n`,
    '',
    'legacy GPS visibility listener'
  );

  return html;
}

module.exports = { applyVisibleElements };
