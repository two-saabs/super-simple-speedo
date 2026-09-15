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
        app.tap()
    }

    private func waitForCoreSpeedometer(timeout: TimeInterval = 10) {
        XCTAssertTrue(app.staticTexts["km/h"].waitForExistence(timeout: timeout))
        XCTAssertTrue(app.buttons["Settings"].waitForExistence(timeout: 3))
    }

    func testNativeFirstRunLocationIntroThenAutomaticStartup() {
        // A clean install now presents the shared location-intro action. On native
        // iOS, returning launches skip it automatically after it has been accepted.
        let letsGoButton = app.buttons["Let’s go!"]
        if letsGoButton.waitForExistence(timeout: 2) {
            letsGoButton.tap()
            app.tap() // Allows XCTest to handle the native location alert.
        }

        waitForCoreSpeedometer()
    }

    func testFrenanoBrandingIsVisibleDuringStartup() {
        let brandText = app.staticTexts["Frenano"]
        let brandImage = app.images["Frenano"]
        XCTAssertTrue(brandText.waitForExistence(timeout: 2) || brandImage.waitForExistence(timeout: 2))
    }

    func testSettingsExposeNativeLocationManagement() {
        waitForCoreSpeedometer()
        app.buttons["Settings"].tap()

        XCTAssertTrue(app.staticTexts["Location"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Close settings"].waitForExistence(timeout: 3))
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
    }
}
