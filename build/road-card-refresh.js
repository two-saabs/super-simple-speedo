function applyRoadCardRefresh(html) {
  const interactiveBefore = `        <button id="limitButton" class="unknown" aria-label="Change speed limit">\n          <span id="limit">?</span>\n        </button>`;
  const interactiveAfter = `        <div id="limitButton" class="unknown" aria-label="Speed limit">\n          <span id="limit">?</span>\n        </div>`;
  if (html.includes(interactiveBefore)) html = html.replace(interactiveBefore, interactiveAfter);

  /* The driver presentation enters at 10 km/h and should return after five
     seconds at 6 km/h or below. The original strict < 6 check could leave the
     header permanently dimmed while the accepted speed sat exactly at 6. */
  html = html.replace(
    `if (state.driverModeActive && trustedSpeed < DRIVER_MODE_EXIT_SPEED && !state.driverExitTimer) {`,
    `if (state.driverModeActive && trustedSpeed <= DRIVER_MODE_EXIT_SPEED && !state.driverExitTimer) {`
  );
  html = html.replace(
    `if (state.watchId !== null && state.lastAcceptedSpeed < DRIVER_MODE_EXIT_SPEED) {`,
    `if (state.watchId !== null && state.lastAcceptedSpeed <= DRIVER_MODE_EXIT_SPEED) {`
  );

  const css = `
<style id="road-card-refresh-v4">
  /* Task 4: visually bind the speed-limit sign and road evidence without
     changing road-matching, confidence or speed-limit inference behaviour. */
  .lower {
    width: min(620px, 90vw);
    grid-template-columns: 132px minmax(0, 1fr);
    gap: 20px;
    padding: 14px 18px;
    border: 1px solid var(--soft-border);
    border-radius: 28px;
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    box-shadow: 0 16px 42px rgba(0,0,0,.26);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
  body.light .lower {
    background: rgba(255,255,255,.90);
    box-shadow: 0 14px 36px rgba(0,0,0,.09);
  }
  /* The displayed limit is informational only: no TAP affordance and no
     accidental route into the manual-limit modal. */
  #limitButton {
    width: 124px;
    height: 124px;
    pointer-events: none;
    cursor: default;
  }
  .lower #limitButton::after {
    display: none !important;
    content: none !important;
  }
  .road-info {
    align-self: center;
  }

  /* Keep the approved portrait geometry: dial where it is, generous breathing
     room, then the compact road card at the existing road-sign height. */
  @media (orientation: portrait) {
    .lower {
      margin-top: clamp(24px, 5vh, 58px);
    }
    body.driver-mode .lower {
      margin-top: clamp(20px, 4vh, 42px);
    }
  }

  /* Landscape: centre the functional pair vertically in the usable area. */
  @media (orientation: landscape) and (max-height: 560px) {
    .cluster {
      transform: translateY(clamp(62px, 12vh, 88px));
    }
    .speed-side {
      padding-top: 0;
    }
    .lower {
      width: min(310px, 37vw);
      margin: 0;
      padding: 14px 16px 16px;
      grid-template-columns: 1fr;
      justify-items: center;
      gap: 12px;
      border-radius: 26px;
    }
    #limitButton {
      width: 110px;
      height: 110px;
    }
    .road-info {
      width: 100%;
      max-width: 250px;
      text-align: center;
    }
    #source, #road, #roadConfidence {
      justify-content: center;
      text-align: center;
    }
    #roadConfidence {
      display: flex;
    }
  }
</style>`;

  if (!html.includes('</head>')) throw new Error('Road card refresh: document head not found');
  return html.replace('</head>', `${css}\n</head>`);
}

module.exports = { applyRoadCardRefresh };
