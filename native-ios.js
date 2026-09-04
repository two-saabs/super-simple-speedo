import { Geolocation } from '@capacitor/geolocation';
import { AppLauncher } from '@capacitor/app-launcher';
import { StatusBar, Style } from '@capacitor/status-bar';

let nextWatchId = 1;
const watches = new Map();

async function configureNativeStatusBar() {
  try {
    await StatusBar.show();
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    const info = await StatusBar.getInfo();
    console.log('[SPEEDO_STATUSBAR]', JSON.stringify(info));
  } catch (error) {
    console.warn('[SPEEDO_STATUSBAR] configuration failed', String(error?.message || error));
  }
}

function permissionError(message = 'Location permission denied.') {
  return { code: 1, message };
}

function normaliseError(error) {
  const message = String(error?.message || error || 'Location unavailable');
  const lower = message.toLowerCase();
  if (lower.includes('denied') || lower.includes('permission')) return permissionError(message);
  if (lower.includes('timeout')) return { code: 3, message };
  return { code: 2, message };
}

function permissionLabel(status) {
  if (status === 'granted') return 'While Using App';
  if (status === 'denied') return 'Denied';
  if (status === 'prompt' || status === 'prompt-with-rationale') return 'Not yet requested';
  return 'Unknown';
}

async function currentPermission() {
  try {
    const result = await Geolocation.checkPermissions();
    return result.location || 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

async function refreshPermissionUi() {
  const status = await currentPermission();
  const label = document.getElementById('nativeLocationPermissionStatus');
  if (label) label.textContent = permissionLabel(status);
  return status;
}

async function ensureLocationPermission() {
  let status = await currentPermission();
  if (status === 'prompt' || status === 'prompt-with-rationale') {
    const result = await Geolocation.requestPermissions({ permissions: ['location'] });
    status = result.location || 'unknown';
  }
  await refreshPermissionUi();
  return status;
}

async function clearNativeWatch(record) {
  if (!record?.nativeId) return;
  try {
    await Geolocation.clearWatch({ id: record.nativeId });
  } catch (_) {}
}

function rectFor(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    bottom: Math.round(rect.bottom),
    right: Math.round(rect.right)
  };
}

function logLayoutDiagnostic(reason) {
  const vv = window.visualViewport;
  const orientation = screen.orientation;
  console.log('[SPEEDO_LAYOUT]', JSON.stringify({
    reason,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    visualViewport: vv ? {
      width: Math.round(vv.width),
      height: Math.round(vv.height),
      offsetTop: Math.round(vv.offsetTop),
      offsetLeft: Math.round(vv.offsetLeft),
      scale: vv.scale
    } : null,
    orientation: orientation ? {
      type: orientation.type,
      angle: orientation.angle
    } : null,
    app: rectFor('#app'),
    main: rectFor('main'),
    cluster: rectFor('.cluster'),
    settings: rectFor('#settingsButton')
  }));
}

function scheduleLayoutDiagnostic(reason) {
  logLayoutDiagnostic(`${reason}:immediate`);
  setTimeout(() => logLayoutDiagnostic(`${reason}:250ms`), 250);
  setTimeout(() => logLayoutDiagnostic(`${reason}:1000ms`), 1000);
}

window.__SPEEDO_NATIVE_GEOLOCATION__ = {
  watchPosition(success, error, options = {}) {
    const localId = nextWatchId++;
    const record = { nativeId: null, cancelled: false };
    watches.set(localId, record);

    (async () => {
      try {
        const status = await ensureLocationPermission();
        if (status !== 'granted') {
          watches.delete(localId);
          error?.(permissionError());
          return;
        }

        const nativeId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: options.enableHighAccuracy !== false,
            maximumAge: Number.isFinite(options.maximumAge) ? options.maximumAge : 0,
            timeout: Number.isFinite(options.timeout) ? options.timeout : 10000
          },
          (position, pluginError) => {
            if (record.cancelled) return;
            if (pluginError) {
              error?.(normaliseError(pluginError));
              return;
            }
            if (position) success?.(position);
          }
        );

        record.nativeId = nativeId;
        if (record.cancelled) {
          await clearNativeWatch(record);
          watches.delete(localId);
        }
      } catch (nativeError) {
        watches.delete(localId);
        error?.(normaliseError(nativeError));
      }
    })();

    return localId;
  },

  clearWatch(localId) {
    const record = watches.get(localId);
    if (!record) return;
    record.cancelled = true;
    watches.delete(localId);
    clearNativeWatch(record);
  }
};

window.__SPEEDO_NATIVE_PERMISSIONS__ = {
  refresh: refreshPermissionUi,
  async openSettings() {
    try {
      await AppLauncher.openUrl({ url: 'app-settings:' });
    } catch (_) {
      window.location.href = 'app-settings:';
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  configureNativeStatusBar();

  const button = document.getElementById('manageLocationPermission');
  button?.addEventListener('click', () => window.__SPEEDO_NATIVE_PERMISSIONS__.openSettings());

  const settingsButton = document.getElementById('settingsButton');
  settingsButton?.addEventListener('click', () => setTimeout(refreshPermissionUi, 0));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshPermissionUi();
  });

  window.addEventListener('orientationchange', () => scheduleLayoutDiagnostic('orientationchange'));
  window.addEventListener('resize', () => scheduleLayoutDiagnostic('resize'));
  window.visualViewport?.addEventListener('resize', () => scheduleLayoutDiagnostic('visualViewport.resize'));

  refreshPermissionUi();
  setTimeout(() => logLayoutDiagnostic('startup'), 500);
});
