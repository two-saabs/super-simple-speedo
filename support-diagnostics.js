'use strict';

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Support diagnostics build injection failed: ${label}`);
  return source.replace(before, after);
}

function injectSupportDiagnostics(html, { appVersion, buildChannel, experimentalFeatures }) {
  html = replaceRequired(
    html,
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">',
    'locked iOS viewport scaling'
  );

  html = replaceRequired(
    html,
    '--safe-top: max(14px, env(safe-area-inset-top));',
    '--safe-top: 14px;',
    'fixed iOS top safe-area padding'
  );

  const viewportStyle = `
  <style id="speedo-ios-viewport-fix">
    body,
    #app {
      height: var(--app-height, 100dvh);
      min-height: var(--app-height, 100dvh);
    }
  </style>
`;

  html = replaceRequired(
    html,
    '</head>',
    `${viewportStyle}</head>`,
    'iOS viewport style insertion'
  );

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
  let lastViewportDiagnosticSignature = "";
  let viewportSettleTimer = null;

  function supportSafeToken(value, maxLength = 90) {
    const text = String(value ?? "").replace(/[\\t\\r\\n]+/g, " ").trim();
    return text.slice(0, maxLength);
  }

  function supportElapsedSeconds(item, firstTimeMs) {
    const timeMs = Date.parse(item.timeUtc || "");
    if (!Number.isFinite(timeMs) || !Number.isFinite(firstTimeMs)) return "";
    return Math.max(0, Math.round((timeMs - firstTimeMs) / 1000));
  }

  function refreshViewportGeometry(reason = "resize") {
    const root = document.documentElement;
    const layoutHeight = Math.round(root.clientHeight || window.innerHeight || 0);
    const innerHeight = Math.round(window.innerHeight || 0);
    const visualHeight = Math.round(window.visualViewport?.height || 0);
    const visualScale = Number(window.visualViewport?.scale || 1);
    const visualOffsetTop = Math.round(window.visualViewport?.offsetTop || 0);
    const visualOffsetLeft = Math.round(window.visualViewport?.offsetLeft || 0);

    // Size the app from the layout viewport, not the visual viewport. iOS can
    // transiently zoom/pan visualViewport during rotation or foregrounding.
    if (layoutHeight > 0) root.style.setProperty("--app-height", layoutHeight + "px");

    const orientation = (window.innerWidth || 0) > (window.innerHeight || 0) ? "LANDSCAPE" : "PORTRAIT";
    const app = document.getElementById("app");
    const safeTop = app ? Math.round(parseFloat(getComputedStyle(app).paddingTop) || 0) : 0;
    const scaleToken = Math.round(visualScale * 100) / 100;
    const signature = [orientation, layoutHeight, innerHeight, visualHeight, scaleToken, visualOffsetTop, visualOffsetLeft, safeTop].join(":");
    if (signature !== lastViewportDiagnosticSignature) {
      lastViewportDiagnosticSignature = signature;
      addDiagnostic({
        event: "VIEWPORT_CHANGE",
        outcome: String(reason || "resize").toUpperCase()
          + "_" + orientation
          + "_LH" + layoutHeight
          + "_IH" + innerHeight
          + "_VH" + visualHeight
          + "_VS" + scaleToken
          + "_OT" + visualOffsetTop
          + "_OL" + visualOffsetLeft
          + "_ST" + safeTop
      });
    }
  }

  function scheduleViewportRefresh(reason = "resize", immediate = true) {
    if (immediate) refreshViewportGeometry(reason + ":immediate");
    clearTimeout(viewportSettleTimer);
    viewportSettleTimer = setTimeout(() => refreshViewportGeometry(reason + ":settled"), 350);
  }

  scheduleViewportRefresh("startup");
  window.addEventListener("resize", () => scheduleViewportRefresh("resize"), { passive: true });
  window.addEventListener("orientationchange", () => scheduleViewportRefresh("orientation"), { passive: true });
  // Keep visualViewport as a diagnostic signal only. Do not let its transient
  // zoomed height resize the app canvas.
  window.visualViewport?.addEventListener("resize", () => scheduleViewportRefresh("visual", false), { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleViewportRefresh("foreground");
  });

  function sanitisedSupportDiagnosticText() {
    const items = state.diagnosticLog.slice(-SUPPORT_REPORT_MAX_EVENTS);
    const firstTimeMs = items.length ? Date.parse(items[0].timeUtc || "") : NaN;
    const ua = supportSafeToken(navigator.userAgent || "unknown", 180)
      .replace(/\\b(?:lat|lon|lng|latitude|longitude)=[^ ;]+/gi, "");
    const header = [
      "# Super Simple Speedo support diagnostics v1",
      "# privacy=sanitised; no coordinates; no road/station/line/destination; no API keys; no persistent identifiers",
      "# app_version=${appVersion}",
      "# build_channel=${buildChannel}",
      "# platform=" + supportSafeToken(navigator.platform || "unknown", 60),
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
    const filename = "super-simple-speedo-support-${appVersion}.txt";
    try {
      if (navigator.share) {
        let files = [];
        try {
          const file = new File([text], filename, { type: "text/plain" });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) files = [file];
        } catch (_) {}
        await navigator.share(files.length
          ? { title: "Super Simple Speedo diagnostics", text: "Sanitised support diagnostics", files }
          : { title: "Super Simple Speedo diagnostics", text });
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

  // IndexedDB transaction errors can occasionally arrive with tx.error === null
  // on iOS. Diagnostics are best-effort: preserve the in-memory/local log and
  // only print an archive warning when WebKit supplies a real error object.
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
