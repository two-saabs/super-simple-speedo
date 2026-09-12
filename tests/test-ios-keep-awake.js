const test = require("node:test");
const assert = require("node:assert/strict");
const { configureKeepAwake, verifyKeepAwake, launchMarker, activeMarker } = require("../scripts/configure-ios-keep-awake");

const baseAppDelegate = `import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        print("active")
    }
}
`;

const appDelegateWithoutActiveCallback = `import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        return true
    }
}
`;

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

test("installs native keep-awake at launch and app activation", () => {
  const result = configureKeepAwake(baseAppDelegate);
  assert.match(result, new RegExp(launchMarker));
  assert.match(result, new RegExp(activeMarker));
  assert.equal(count(result, /application\.isIdleTimerDisabled = true/g), 2);
  assert.equal(count(result, /func applicationDidBecomeActive\(_ application: UIApplication\)/g), 1);
  assert.ok(result.indexOf("application.isIdleTimerDisabled = true") < result.indexOf("return true"));
});

test("adds one activation callback when Capacitor template has none", () => {
  const result = configureKeepAwake(appDelegateWithoutActiveCallback);
  assert.equal(count(result, /func applicationDidBecomeActive\(_ application: UIApplication\)/g), 1);
  assert.equal(count(result, /application\.isIdleTimerDisabled = true/g), 2);
  verifyKeepAwake(result);
});

test("is idempotent across repeated iOS syncs", () => {
  const once = configureKeepAwake(baseAppDelegate);
  const twice = configureKeepAwake(once);
  assert.equal(twice, once);
  assert.equal(count(twice, /func applicationDidBecomeActive\(_ application: UIApplication\)/g), 1);
  assert.equal(count(twice, /application\.isIdleTimerDisabled = true/g), 2);
});

test("repairs the legacy duplicate applicationDidBecomeActive regression", () => {
  const broken = baseAppDelegate.replace("\n}\n", `

    // Frenano: keep the display awake while the app is active.
    // The web Wake Lock API is not reliable inside the iOS Capacitor WebView,
    // so enforce the equivalent native iOS behaviour and re-apply it whenever
    // this AppDelegate lifecycle callback fires.
    func applicationDidBecomeActive(_ application: UIApplication) {
        application.isIdleTimerDisabled = true
    }

}
`);
  assert.equal(count(broken, /func applicationDidBecomeActive\(_ application: UIApplication\)/g), 2);
  const repaired = configureKeepAwake(broken);
  assert.equal(count(repaired, /func applicationDidBecomeActive\(_ application: UIApplication\)/g), 1);
  assert.equal(count(repaired, /application\.isIdleTimerDisabled = true/g), 2);
  verifyKeepAwake(repaired);
});

test("fails closed when AppDelegate no longer exposes the launch lifecycle hook", () => {
  assert.throws(
    () => configureKeepAwake("import UIKit\nclass AppDelegate: UIResponder {\n}\n"),
    /didFinishLaunchingWithOptions/
  );
});

test("verification rejects a release with incomplete native keep-awake wiring", () => {
  const incomplete = `${launchMarker}\n${activeMarker}\nfunc applicationDidBecomeActive(_ application: UIApplication) {\n application.isIdleTimerDisabled = true\n}`;
  assert.throws(() => verifyKeepAwake(incomplete), /native idle timer override was not installed cleanly/);
});
