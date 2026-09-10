import XCTest

final class FrenanoUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false

        addUIInterruptionMonitor(withDescription: "Location permission") { alert in
            for label in ["Allow While Using App", "Allow Once"] {
                let button = alert.buttons[label]
                if button.exists {
                    button.tap()
                    return true
                }
            }
            return false
        }

        app = XCUIApplication()
        app.launch()
        app.tap() // Gives XCTest a chance to handle the first-run location alert.
    }

    private func waitForCoreSpeedometer(timeout: TimeInterval = 8) {
        XCTAssertTrue(app.staticTexts["km/h"].waitForExistence(timeout: timeout))
        XCTAssertTrue(app.buttons["Change speed limit"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Settings"].waitForExistence(timeout: 3))
    }

    func testNativeStartupSkipsLetsGoAndShowsCoreSpeedometer() {
        // Native iOS auto-starts after the short Frenano brand moment. The web-only
        // Let’s go control must never become an interactive native UI element.
        XCTAssertFalse(app.buttons["Let’s go!"].waitForExistence(timeout: 2))
        waitForCoreSpeedometer()
    }

    func testFrenanoBrandingIsVisibleDuringStartup() {
        XCTAssertTrue(app.staticTexts["Frenano"].waitForExistence(timeout: 3))
    }

    func testSettingsExposeNativeLocationManagement() {
        waitForCoreSpeedometer()
        app.buttons["Settings"].tap()

        XCTAssertTrue(app.staticTexts["Location access"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Manage in iPhone Settings"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Help & privacy"].waitForExistence(timeout: 3))
    }

    func testAboutShowsAppStoreVersion() {
        waitForCoreSpeedometer()
        app.buttons["Settings"].tap()

        let version = app.staticTexts.matching(
            NSPredicate(format: "label BEGINSWITH %@", "Version 1.0")
        ).firstMatch
        XCTAssertTrue(version.waitForExistence(timeout: 3))
    }

    func testPortraitLandscapePortraitKeepsCoreUIAvailable() {
        waitForCoreSpeedometer()

        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.staticTexts["km/h"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Settings"].exists)

        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(app.staticTexts["km/h"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Settings"].exists)
        XCTAssertTrue(app.buttons["Change speed limit"].exists)
    }
}
