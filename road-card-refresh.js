function applyRoadCardRefresh(html) {
  const css = `
<style id="road-card-refresh-v1">
  /* Task 4: visually bind the speed-limit sign and road evidence without
     changing any road-matching, confidence or speed-limit behaviour. */
  .lower {
    width: min(680px, 94vw);
    grid-template-columns: 148px minmax(0, 1fr);
    gap: 24px;
    padding: 18px 22px;
    border: 1px solid var(--soft-border);
    border-radius: 30px;
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    box-shadow: 0 18px 48px rgba(0,0,0,.28);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
  body.light .lower {
    background: rgba(255,255,255,.90);
    box-shadow: 0 16px 42px rgba(0,0,0,.10);
  }
  .lower #limitButton::after {
    bottom: -25px;
  }
  .road-info {
    align-self: center;
  }

  /* Keep the approved portrait geometry: dial where it is, generous breathing
     room, then the card beginning at the existing road-sign height. */
  @media (orientation: portrait) {
    .lower {
      margin-top: clamp(24px, 5vh, 58px);
    }
    body.driver-mode .lower {
      margin-top: clamp(20px, 4vh, 42px);
    }
  }

  /* Landscape: centre the functional pair vertically in the usable area.
     The header stays independently pinned at the top. */
  @media (orientation: landscape) and (max-height: 560px) {
    .cluster {
      transform: translateY(clamp(62px, 12vh, 88px));
    }
    .speed-side {
      padding-top: 0;
    }
    .lower {
      width: min(330px, 39vw);
      margin: 0;
      padding: 16px 18px 19px;
      grid-template-columns: 1fr;
      justify-items: center;
      gap: 14px;
      border-radius: 28px;
    }
    #limitButton {
      width: 118px;
      height: 118px;
    }
    .road-info {
      width: 100%;
      max-width: 270px;
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
