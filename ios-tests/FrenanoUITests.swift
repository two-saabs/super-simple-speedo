import XCTest

final class FrenanoUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testLaunchScreenShowsPrimaryAction() {
        XCTAssertTrue(app.buttons["Let’s go!"].waitForExistence(timeout: 5))
    }

    func testLaunchScreenShowsSafetyResponsibilityCopy() {
        XCTAssertTrue(
            app.staticTexts["Driving safely and respecting speed limits is always the responsibility of the driver."]
                .waitForExistence(timeout: 5)
        )
    }

    func testFrenanoBrandingIsVisible() {
        XCTAssertTrue(app.staticTexts["Frenano"].waitForExistence(timeout: 5))
    }

    func testCoreSpeedometerElementsExist() {
        XCTAssertTrue(app.staticTexts["km/h"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Change speed limit"].exists)
        XCTAssertTrue(app.buttons["Settings"].exists)
    }

    func testPortraitLandscapePortraitKeepsCoreUIAvailable() {
        XCTAssertTrue(app.buttons["Let’s go!"].waitForExistence(timeout: 5))
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.buttons["Let’s go!"].waitForExistence(timeout: 3))
        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(app.buttons["Let’s go!"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Settings"].exists)
        XCTAssertTrue(app.buttons["Change speed limit"].exists)
    }
}
