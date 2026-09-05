function applySettingsRedesign(html) {
  const css = `
<style id="settings-redesign-v1">
  /* Test/experimental UI refresh only. No settings behaviour is changed. */
  #settingsModal .sheet {
    width: min(94vw, 560px);
    max-height: min(88svh, 820px);
    padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
    border-radius: 28px 28px 0 0;
    background: color-mix(in srgb, var(--panel) 94%, transparent);
    border: 1px solid var(--soft-border);
    box-shadow: 0 -18px 60px rgba(0,0,0,.36);
    backdrop-filter: blur(28px) saturate(1.15);
    -webkit-backdrop-filter: blur(28px) saturate(1.15);
  }
  #settingsModal .grabber {
    width: 42px;
    height: 5px;
    margin: 0 auto 14px;
    border-radius: 999px;
    background: var(--fg);
    opacity: .16;
  }
  #settingsModal h2 {
    margin: 2px 6px 20px;
    font-size: 30px;
    line-height: 1.05;
    font-weight: 850;
    letter-spacing: -.035em;
  }
  #settingsModal .settings-section {
    margin: 0 0 14px;
    border: 1px solid var(--soft-border);
    border-radius: 18px;
    overflow: hidden;
    background: var(--soft);
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
  }
  #settingsModal .settings-section-header {
    min-height: 62px;
    padding: 0 15px;
    border: 0;
    background: transparent;
    display: grid;
    grid-template-columns: 34px minmax(0,1fr) auto;
    align-items: center;
    gap: 11px;
    width: 100%;
  }
  #settingsModal .settings-section-header::before {
    content: attr(data-settings-icon);
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: var(--accent-soft);
    color: var(--fg);
    font-size: 18px;
    font-weight: 760;
    line-height: 1;
  }
  #settingsModal .settings-section-title {
    margin: 0;
    padding: 0;
    font-size: 17px;
    line-height: 1.2;
    font-weight: 760;
    letter-spacing: -.012em;
    color: var(--fg);
    opacity: .96;
  }
  #settingsModal .settings-section-chevron {
    font-size: 25px;
    line-height: 1;
    opacity: .35;
    transition: transform .2s ease, opacity .2s ease;
  }
  #settingsModal .settings-section-header[aria-expanded="true"] .settings-section-chevron {
    transform: rotate(90deg);
    opacity: .62;
  }
  #settingsModal .settings-section-body {
    padding: 0 14px 14px;
  }
  #settingsModal .settings-section-body > :first-child {
    margin-top: 0;
  }
  #settingsModal .setting-row,
  #settingsModal .setting,
  #settingsModal .settings-row {
    min-height: 54px;
    border-radius: 13px;
  }
  #settingsModal .segment-button,
  #settingsModal button,
  #settingsModal [role="button"] {
    -webkit-tap-highlight-color: transparent;
  }
  #settingsModal .settings-section[data-settings-section="advanced-and-experimental-features"] {
    border-style: dashed;
  }
  #settingsModal .settings-redesign-note {
    margin: 18px 8px 2px;
    text-align: center;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: .02em;
    opacity: .34;
  }
  body.light #settingsModal .sheet {
    box-shadow: 0 -18px 60px rgba(0,0,0,.15);
  }
  @media (max-width: 390px) {
    #settingsModal .sheet { width: 100vw; padding-left: 12px; padding-right: 12px; }
    #settingsModal h2 { font-size: 27px; }
    #settingsModal .settings-section-header { min-height: 58px; padding: 0 12px; }
  }
</style>`;

  const js = `
<script id="settings-redesign-v1-script">
(() => {
  const decorateSettings = () => {
    const modal = document.getElementById('settingsModal');
    if (!modal || modal.dataset.redesigned === 'true') return;
    modal.dataset.redesigned = 'true';

    const icons = {
      audio: '♪',
      display: '☼',
      statistics: '▥',
      about: 'ⓘ',
      privacy: '◇',
      'advanced-and-experimental-features': '⚗'
    };
    const labels = {
      display: 'Appearance & Display',
      statistics: 'Usage & Statistics'
    };

    modal.querySelectorAll('.settings-section').forEach(section => {
      const key = section.dataset.settingsSection || '';
      const header = section.querySelector('.settings-section-header');
      const title = section.querySelector('.settings-section-title');
      if (header) header.dataset.settingsIcon = icons[key] || '•';
      if (title && labels[key]) title.textContent = labels[key];
    });

    const sheet = modal.querySelector('.sheet');
    if (sheet && !sheet.querySelector('.settings-redesign-note')) {
      const note = document.createElement('div');
      note.className = 'settings-redesign-note';
      note.textContent = 'Super Simple Speedo · Made in Switzerland';
      sheet.appendChild(note);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateSettings, { once: true });
  } else {
    decorateSettings();
  }
})();
</script>`;

  if (!html.includes('</head>') || !html.includes('</body>')) {
    throw new Error('Settings redesign: expected HTML closing tags not found');
  }
  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace('</body>', `${js}\n</body>`);
  return html;
}

module.exports = { applySettingsRedesign };
