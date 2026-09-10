function applySimpleStartup(html) {
  const clickTarget = `    if (button) {\n      button.disabled = true;\n      button.textContent = "Starting…";\n    }`;
  const clickReplacement = `${clickTarget}\n    // The launch screen is now intentionally just a calm brand moment. Once the\n    // user taps Let’s go, reveal the app immediately while GPS starts behind it.\n    const launchScreen = $("launchScreen");\n    if (launchScreen) {\n      launchScreen.classList.add("hide");\n      launchScreen.setAttribute("aria-hidden", "true");\n    }`;

  if (!html.includes(clickTarget)) {
    throw new Error("Simple startup: Let’s go handler target not found");
  }
  html = html.replace(clickTarget, clickReplacement);

  const css = `\n<style id="simple-startup-v1">\n  /* Keep the start screen, but strip it back to logo + one deliberate action. */\n  #launchSatelliteTrack,\n  #launchChecklist,\n  #launchDisclaimer,\n  #launchStatus,\n  #launchProgress { display:none !important; }\n\n  .launch-core { width:min(82vw, 390px); }\n  .launch-brand { margin-bottom:34px !important; }\n  .launch-brand-icon {\n    animation:frenanoLaunchFloat 4.8s ease-in-out infinite;\n    will-change:transform;\n  }\n  .launch-brand-mark {\n    animation:frenanoLaunchGlow 4.8s ease-in-out infinite;\n  }\n  .launch-action { margin-top:28px; }\n\n  @keyframes frenanoLaunchFloat {\n    0%,100% { transform:translateY(0) scale(1); }\n    50% { transform:translateY(-8px) scale(1.012); }\n  }\n  @keyframes frenanoLaunchGlow {\n    0%,100% { filter:brightness(.98); }\n    50% { filter:brightness(1.05); }\n  }\n\n  @media (prefers-reduced-motion:reduce) {\n    .launch-brand-icon, .launch-brand-mark { animation:none; }\n  }\n</style>`;

  if (!html.includes("</head>")) throw new Error("Simple startup: document head not found");
  return html.replace("</head>", `${css}\n</head>`);
}

module.exports = { applySimpleStartup };
