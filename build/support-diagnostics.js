'use strict';

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Support diagnostics build injection failed: ${label}`);
  return source.replace(before, after);
}

function injectSupportDiagnostics(html, { appVersion, buildChannel, experimentalFeatures }) {
  const supportSection = `
    <div class="settings-section" data-settings-section="help-and-diagnostics">
      <button class="settings-section-header" type="button" aria-expanded="false">
        <div class="settings-section-title">Help & Diagnostics</div>
        <span class="settings-section-chevron" aria-hidden="true">›</span>
      </button>
      <div class="settings-section-body">
        <div class="setting">
          <div class="setting-title">Share diagnostic log</div>
          <div class="setting-note" style="margin-top:8px;line-height:1.5;">
            Creates a small support report on your device. It leaves out coordinates, road names, stations, public-transport lines and destinations, API keys, and persistent identifiers.
          </div>
          <div class="setting-note" style="margin-top:10px;line-height:1.5;">
            Nothing is uploaded automatically. You choose whether and how to share it.
          </div>
          <button class="wide-button secondary" id="shareSupportDiagnostics" style="margin-top:14px;">Share diagnostic log</button>
          <div class="diagnostics-format-note" id="supportDiagnosticsStatus">Recent technical events only · local to this device</div>
        </div>
      </div>
    </div>
`;

  html = replaceRequired(
    html,
    '    <div class="settings-section" data-settings-section="advanced-and-experimental-features">',
    `${supportSection}    <div class="settings-section" data-settings-section="advanced-and-experimental-features">`,
    'Help & Diagnostics settings insertion'
  );

  const supportCode = `
  const SUPPORT_REPORT_MAX_EVENTS = 150;

  function supportSafeToken(value, maxLength = 90) {
    const text = String(value ?? "").replace(/[\\t\\r\\n]+/g, " ").trim();
    return text.slice(0, maxLength);
  }

  function supportElapsedSeconds(item, firstTimeMs) {
    const timeMs = Date.parse(item.timeUtc || "");
    if (!Number.isFinite(timeMs) || !Number.isFinite(firstTimeMs)) return "";
    return Math.max(0, Math.round((timeMs - firstTimeMs) / 1000));
  }

  function supportPlatformCapabilities() {
    let native = false;
    let nativePlatform = "";
    try {
      native = Boolean(window.Capacitor?.isNativePlatform?.());
      nativePlatform = String(window.Capacitor?.getPlatform?.() || "").toLowerCase();
    } catch (_) {}
    const nativeIos = native && nativePlatform === "ios";
    return {
      nativeIos,
      nativeLocation: nativeIos,
      nativeKeepAwake: nativeIos,
      webWakeLock: Boolean(navigator.wakeLock?.request)
    };
  }

  function supportPublicItems(capabilities) {
    const source = state.diagnosticLog.slice(-SUPPORT_REPORT_MAX_EVENTS);
    const result = [];
    let lastStartupGpsFirstCallbackAt = -Infinity;

    for (const item of source) {
      if (!item || typeof item !== "object") continue;

      // Native iOS deliberately uses UIApplication's idle-timer override instead
      // of the Web Wake Lock API. Suppress misleading web rejections there while
      // retaining WAKE_LOCK events on the web where they are diagnostically useful.
      if (capabilities.nativeIos && item.event === "WAKE_LOCK") continue;

      // A single GPS callback can fan out through startup bookkeeping. Keep the
      // first marker and suppress only near-identical repeats from the same moment.
      if (item.event === "STARTUP_GPS_FIRST_CALLBACK") {
        const timeMs = Date.parse(item.timeUtc || "");
        if (Number.isFinite(timeMs) && timeMs - lastStartupGpsFirstCallbackAt < 3000) continue;
        if (Number.isFinite(timeMs)) lastStartupGpsFirstCallbackAt = timeMs;
      }

      result.push(item);
    }

    if (capabilities.nativeIos && result.length) {
      result.unshift({
        ...result[0],
        event: "SCREEN_AWAKE_NATIVE",
        outcome: "ENABLED",
        reason: "ios_idle_timer_disabled"
      });
    }

    return result.slice(-SUPPORT_REPORT_MAX_EVENTS);
  }

  function sanitisedSupportDiagnosticText() {
    const capabilities = supportPlatformCapabilities();
    const items = supportPublicItems(capabilities);
    const firstTimeMs = items.length ? Date.parse(items[0].timeUtc || "") : NaN;
    const ua = supportSafeToken(navigator.userAgent || "unknown", 180)
      .replace(/\\b(?:lat|lon|lng|latitude|longitude)=[^ ;]+/gi, "");
    const capabilitySummary = [
      `native_ios=${capabilities.nativeIos ? 1 : 0}`,
      `native_location=${capabilities.nativeLocation ? 1 : 0}`,
      `native_keep_awake=${capabilities.nativeKeepAwake ? 1 : 0}`,
      `web_wake_lock=${capabilities.webWakeLock ? 1 : 0}`
    ].join(";");
    const header = [
      "# Frenano support diagnostics v2",
      "# privacy=sanitised; no coordinates; no road/station/line/destination; no API keys; no persistent identifiers",
      "# app_version=${appVersion}",
      "# build_channel=${buildChannel}",
      "# platform=" + supportSafeToken(navigator.platform || "unknown", 60),
      "# capabilities=" + capabilitySummary,
      "# user_agent=" + ua,
      "# events=" + items.length,
      "# columns=elapsed_s\\ttype\\tshown_kmh\\traw_kmh\\tderived_kmh\\taccuracy_m\\tsource\\tdecision\\treasons\\toutcome\\thttp_status"
    ];

    const rows = items.map(item => {
      const reasons = Array.isArray(item.reasons)
        ? item.reasons.map(v => supportSafeToken(v, 60)).join("|")
        : supportSafeToken(item.reason || item.roadDecision?.reason || "", 120);
      const type = supportSafeToken(item.event || "SPEED", 40);
      const outcome = supportSafeToken(item.outcome || item.roadDecision?.outcome || item.roadDecision?.state || "", 80);
      const httpStatus = item.response?.httpStatus ?? "";
      return [
        supportElapsedSeconds(item, firstTimeMs),
        type,
        item.displayedKmh ?? "",
        item.rawKmh ?? "",
        item.derivedKmh ?? "",
        item.accuracyMetres ?? "",
        supportSafeToken(item.speedSource || "", 30),
        supportSafeToken(item.speedDecision || item.decision || "", 50),
        reasons,
        outcome,
        httpStatus
      ].map(value => supportSafeToken(value, 180)).join("\\t");
    });

    return [...header, ...rows].join("\\n");
  }

  async function shareSupportDiagnostics() {
    const status = $("supportDiagnosticsStatus");
    const text = sanitisedSupportDiagnosticText();
    const filename = "frenano-support-${appVersion}.txt";
    try {
      if (navigator.share) {
        let files = [];
        try {
          const file = new File([text], filename, { type: "text/plain" });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) files = [file];
        } catch (_) {}
        await navigator.share(files.length
          ? { title: "Frenano diagnostics", text: "Sanitised support diagnostics", files }
          : { title: "Frenano diagnostics", text });
        if (status) status.textContent = "Shared from this device · nothing uploaded automatically";
        return;
      }
      await navigator.clipboard.writeText(text);
      if (status) status.textContent = "Sanitised diagnostic log copied to clipboard";
      if (typeof showToast === "function") showToast("Diagnostic log copied");
    } catch (error) {
      if (error?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = "Share unavailable · diagnostic log copied instead";
        if (typeof showToast === "function") showToast("Diagnostic log copied");
      } catch (_) {
        if (status) status.textContent = "Could not open sharing on this device";
      }
    }
  }

  $("shareSupportDiagnostics")?.addEventListener("click", shareSupportDiagnostics);

`;

  html = replaceRequired(
    html,
    '  function liveIntelligenceLine(item) {',
    `${supportCode}  function liveIntelligenceLine(item) {`,
    'sanitised support report code insertion'
  );

  // IndexedDB transaction errors can occasionally arrive with tx.error === null.
  // Diagnostics are best-effort, so ignore null failures but keep real errors visible.
  html = replaceRequired(
    html,
    '  async function archiveDiagnosticEntry(entry) {\n    const db = await openDiagnosticArchive();',
    '  async function archiveDiagnosticEntry(entry) {\n    if (!entry || typeof entry !== "object") return;\n    const db = await openDiagnosticArchive();',
    'diagnostic archive entry guard'
  );
  html = replaceRequired(
    html,
    '    } catch (error) {\n      console.warn("Could not archive diagnostic entry", error);\n    }',
    '    } catch (error) {\n      if (error) console.warn("Could not archive diagnostic entry", error);\n    }',
    'diagnostic archive null warning guard'
  );

  if (!experimentalFeatures) {
    html = replaceRequired(html, 'const DIAGNOSTIC_MAX_ENTRIES = 1200;', 'const DIAGNOSTIC_MAX_ENTRIES = 300;', 'stable recent diagnostic cap');
    html = replaceRequired(html, 'const DIAGNOSTIC_ARCHIVE_DAYS = 30;', 'const DIAGNOSTIC_ARCHIVE_DAYS = 1;', 'stable diagnostic retention');
    html = replaceRequired(
      html,
      'diagnosticsEnabled: localStorage.getItem("diagnosticsEnabled") === "true",',
      'diagnosticsEnabled: true,',
      'stable local diagnostics enabled'
    );
  }

  return html;
}

module.exports = { injectSupportDiagnostics };
