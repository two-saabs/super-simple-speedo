'use strict';

function applyHelpContactPrivacyFix(html, replaceRequiredSnippet, { appVersion, buildChannel }) {
  html = replaceRequiredSnippet(
    html,
    '<div class="settings-section-title">Privacy</div>',
    '<div class="settings-section-title">Help, contact & privacy</div>',
    'index.template.html'
  );

  const privacyLink = '<div style="margin-top:10px;"><a href="/privacy.html" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Privacy Policy</a></div>';
  const subject = encodeURIComponent(`Super Simple Speedo support — v${appVersion} (${buildChannel})`);
  const body = encodeURIComponent(`Tell us what happened:\n\nApp version: v${appVersion}\nBuild: ${buildChannel}\n`);

  const bundledHelp = `${privacyLink}\n        <div style="margin-top:18px;">\n          <a class="wide-button secondary" href="mailto:support@supersimplespeedo.app?subject=${subject}&body=${body}" style="text-decoration:none;">Contact support</a>\n          <div class="setting-note" style="margin-top:8px;line-height:1.5;">support@supersimplespeedo.app · version details are added automatically</div>\n        </div>\n        <div class="setting" style="margin-top:18px;">\n          <div class="setting-title">Support diagnostics</div>\n          <div class="setting-note" style="margin-top:8px;line-height:1.5;">\n            Creates a small support report on your device. It leaves out coordinates, road names, stations, public-transport lines and destinations, API keys, and persistent identifiers.\n          </div>\n          <div class="setting-note" style="margin-top:10px;line-height:1.5;">\n            Nothing is uploaded automatically. You choose whether and how to share it.\n          </div>\n          <button class="wide-button secondary" id="shareSupportDiagnostics" style="margin-top:14px;">Share diagnostic log</button>\n          <div class="diagnostics-format-note" id="supportDiagnosticsStatus">Recent technical events only · local to this device</div>\n        </div>`;

  html = replaceRequiredSnippet(html, privacyLink, bundledHelp, 'index.template.html');

  const separateSupportSection = `\n    <div class="settings-section" data-settings-section="help-and-diagnostics">\n      <button class="settings-section-header" type="button" aria-expanded="false">\n        <div class="settings-section-title">Help & Diagnostics</div>\n        <span class="settings-section-chevron" aria-hidden="true">›</span>\n      </button>\n      <div class="settings-section-body">\n        <div class="setting">\n          <div class="setting-title">Share diagnostic log</div>\n          <div class="setting-note" style="margin-top:8px;line-height:1.5;">\n            Creates a small support report on your device. It leaves out coordinates, road names, stations, public-transport lines and destinations, API keys, and persistent identifiers.\n          </div>\n          <div class="setting-note" style="margin-top:10px;line-height:1.5;">\n            Nothing is uploaded automatically. You choose whether and how to share it.\n          </div>\n          <button class="wide-button secondary" id="shareSupportDiagnostics" style="margin-top:14px;">Share diagnostic log</button>\n          <div class="diagnostics-format-note" id="supportDiagnosticsStatus">Recent technical events only · local to this device</div>\n        </div>\n      </div>\n    </div>\n`;

  html = replaceRequiredSnippet(html, separateSupportSection, '\n', 'generated support settings');
  return html;
}

module.exports = { applyHelpContactPrivacyFix };
