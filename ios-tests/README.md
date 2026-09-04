# Super Simple Speedo iOS tests

The native Xcode project is generated locally by Capacitor and is not committed to this repository. The test sources live here so they remain version-controlled and can be copied into each generated iOS project.

## First-time setup

1. Build/sync the iOS project:
   `npm run ios:sync`
2. Install the version-controlled test sources:
   `npm run ios:tests:install`
3. Open Xcode:
   `npm run ios:open`
4. In Xcode choose **File > New > Target... > iOS UI Testing Bundle**.
5. Name the target `AppUITests` and select the main `App` application as the target application.
6. Add `ios/App/AppUITests/SuperSimpleSpeedoUITests.swift` to the `AppUITests` target if Xcode has not already picked it up.
7. Run the suite with **Command-U**.

## Code coverage

In Xcode choose **Product > Scheme > Edit Scheme... > Test > Options** and enable **Code Coverage**. After running the tests, open the Report navigator and select the latest Test report to inspect coverage.

For this hybrid app, Xcode coverage measures the native iOS code exercised by tests. It does not replace JavaScript regression/unit testing for the Speedo engine, road matching, transport inference, or diagnostics logic.

## First smoke suite

The initial UI suite checks that:

- the `Let’s go!` launch action exists;
- the driver responsibility copy is present;
- the speed unit and important controls exist;
- Settings has a meaningful accessibility name;
- the speed-limit control has a meaningful accessibility name;
- portrait -> landscape -> portrait does not make the core UI disappear.

These are intentionally small smoke tests. Add regression tests when a real iOS bug is fixed so the same bug cannot silently return.
