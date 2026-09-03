import XCTest

final class AppStoreUITests: XCTestCase {
    private let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launchArguments = ["-AppleLanguages", "(pl)", "-AppleLocale", "pl_PL"]
        app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 45))
        let skip = app.buttons["Pomiń"].firstMatch
        if skip.waitForExistence(timeout: 10) { skip.tap() }
    }

    private func button(_ label: String) -> XCUIElement {
        let controls = app.descendants(matching: .any).matching(NSPredicate(
            format: "(elementType == %d OR elementType == %d) AND label == %@",
            XCUIElement.ElementType.button.rawValue,
            XCUIElement.ElementType.switch.rawValue, label
        ))
        return controls.allElementsBoundByIndex.first(where: { $0.isHittable }) ?? controls.firstMatch
    }

    private func tap(_ label: String, contains: Bool = false) {
        let element = contains
            ? app.buttons.matching(NSPredicate(format: "label CONTAINS %@", label)).firstMatch
            : button(label)
        XCTAssertTrue(element.waitForExistence(timeout: 15), label)
        for _ in 0..<8 {
            if element.isHittable { break }
            if element.frame.minY < 100 { app.webViews.firstMatch.swipeDown() }
            else { app.webViews.firstMatch.swipeUp() }
        }
        XCTAssertTrue(element.isHittable, label)
        element.tap()
    }

    private func visibleText(_ text: String) -> Bool {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@", text))
            .firstMatch.waitForExistence(timeout: 15)
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func scrollToHeading(_ label: String) {
        let heading = app.staticTexts[label].firstMatch
        XCTAssertTrue(heading.waitForExistence(timeout: 15), app.debugDescription)
        for _ in 0..<10 {
            let distance = heading.frame.minY - 140
            if abs(distance) < 35 { break }
            // Drag in the page margin, outside the report textarea and wind sliders.
            let start = app.webViews.firstMatch.coordinate(withNormalizedOffset: CGVector(dx: 0.98, dy: 0.75))
            let end = start.withOffset(CGVector(dx: 0, dy: -min(max(distance * 0.5, -250), 250)))
            start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
        }
        capture("qa-heading-\(label)")
        XCTAssertTrue(heading.isHittable, app.debugDescription)
    }

    func test01NativeScreensAndReportDistinction() {
        XCTAssertTrue(visibleText("Zauważ niebo."))
        capture("01-dzis")
        tap("METAR / TAF", contains: true)
        XCTAssertTrue(visibleText("METAR i TAF bez zgadywania"))
        capture("02-metar-taf")
        let input = app.textViews.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        tap("TAF: KLVM bez nagłówka")
        XCTAssertEqual(input.value as? String, "KLVM 261730Z 2618/2718 29008KT P6SM FEW090 BKN200 FM262300 VRB06KT P6SM VCSH SCT100 BKN140 PROB30 2623/2704 VRB25G40KT 6SM -TSRA BKN080CB FM270700 30008KT P6SM SCT100 BKN160")
        XCTAssertTrue(visibleText("Oś prognozy"))
        XCTAssertFalse(app.staticTexts["Temperatura / rosa"].exists)
        capture("qa-taf-detection")
        tap("Wiatr")
        XCTAssertTrue(visibleText("Wiatr"))
        capture("03-wiatr")
        tap("Atlas")
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Cirrus, pierzaste")).firstMatch.waitForExistence(timeout: 15))
        capture("04-atlas")
    }

    func test02HelpAndPrivacyAreReachable() {
        tap("Pomoc i prywatność")
        XCTAssertTrue(visibleText("Aparat i biblioteka"))
        tap("Prywatność")
        XCTAssertTrue(visibleText("Twoje niebo jest Twoje."))
        XCTAssertTrue(visibleText("Co zostaje na urządzeniu"))
        capture("qa-prywatnosc")
    }

    func test03PhotoLibraryAndPersistentObservation() {
        // Run on an isolated simulator, with camera denied and licensed atlas photos added.
        // This exercises the real picker/model/vault, not physical camera hardware.
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let fullAccess = springboard.buttons["Pełny dostęp"]
        if fullAccess.waitForExistence(timeout: 2) { fullAccess.tap() }
        for attempt in 1...2 {
            tap("Dziś")
            tap("Obserwuj niebo")
            let permissionAlert = app.alerts["CHMURNIK"]
            if permissionAlert.waitForExistence(timeout: 4) {
                permissionAlert.buttons["OK"].tap()
            }
            XCTAssertTrue(visibleText("[0003]"))
            let gallery = button("Wybierz z biblioteki")
            XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: gallery)], timeout: 20), .completed)
            tap("Wybierz z biblioteki")
            if fullAccess.waitForExistence(timeout: 3) { fullAccess.tap() }
            let done = app.buttons["Done"].firstMatch
            XCTAssertTrue(done.waitForExistence(timeout: 15), app.debugDescription + springboard.debugDescription)
            capture("qa-gallery-\(attempt)")
            let photos = app.scrollViews.buttons
            let photo = attempt == 1 ? photos.firstMatch : photos.element(boundBy: photos.count - 1)
            XCTAssertTrue(photo.waitForExistence(timeout: 10), app.debugDescription)
            photo.tap()
            XCTAssertTrue(done.isEnabled)
            done.tap()
            let save = button("Zapisz w Moim niebie")
            XCTAssertTrue(save.waitForExistence(timeout: 45), app.debugDescription)
            XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: save)], timeout: 45), .completed)
            XCTAssertTrue(visibleText("To podpowiedź, nie werdykt."))
            capture("qa-local-model-\(attempt)")
            tap("Zapisz w Moim niebie")
            XCTAssertTrue(visibleText("Co widzisz Ty?"), app.debugDescription)
            XCTAssertTrue(visibleText("3.0-ensemble"), app.debugDescription)
            app.terminate()
            app.launch()
            tap("Moje niebo")
            let observation = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Hipoteza do sprawdzenia")).firstMatch
            XCTAssertTrue(observation.waitForExistence(timeout: 15), app.debugDescription)
            observation.tap()
            XCTAssertTrue(visibleText("Co widzisz Ty?"))
            XCTAssertTrue(visibleText("3.0-ensemble"))
            capture("05-moje-niebo-\(attempt)")
        }
        tap("Moje niebo")
        XCTAssertGreaterThanOrEqual(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Hipoteza do sprawdzenia")).count, 2)
        let date = app.descendants(matching: .any).matching(NSPredicate(
            format: "label == %@ AND elementType != %d", "Dzień w kalendarzu",
            XCUIElement.ElementType.staticText.rawValue
        )).firstMatch
        XCTAssertTrue(date.waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertGreaterThan(date.frame.width, 0)
        XCTAssertLessThanOrEqual(date.frame.maxX, app.frame.maxX - 10, app.debugDescription)
        capture("06-kolekcja")
    }

    func test04UsefulToolScreens() {
        tap("METAR / TAF", contains: true)
        tap("TAF: KLVM bez nagłówka")
        scrollToHeading("Oś prognozy")
        capture("store-taf-timeline")
        tap("Wiatr")
        scrollToHeading("Wiatr na pokładzie")
        capture("store-wind-tool")
        tap("Atlas")
        tap("Cirrus, pierzaste", contains: true)
        XCTAssertTrue(visibleText("PiccoloNamek"), app.debugDescription)
        capture("store-atlas-cirrus")
    }

    func test05TabletWorkspaceRotatesWithoutLosingTheRoute() throws {
        #if targetEnvironment(macCatalyst)
        throw XCTSkip("Tablet orientation test")
        #else
        guard app.frame.width > 700 else { throw XCTSkip("iPad only") }
        defer { XCUIDevice.shared.orientation = .portrait }
        capture("ipad-portrait-home")
        XCUIDevice.shared.orientation = .landscapeLeft
        tap("Atlas")
        tap("Cirrus, pierzaste", contains: true)
        XCTAssertTrue(visibleText("PiccoloNamek"))
        capture("ipad-landscape-atlas")
        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(visibleText("PiccoloNamek"))
        capture("ipad-portrait-atlas")
        XCUIDevice.shared.orientation = .landscapeLeft
        tap("Zamknij kartę")
        tap("METAR i TAF")
        tap("TAF: KLVM bez nagłówka")
        XCTAssertTrue(visibleText("Oś prognozy"))
        capture("ipad-landscape-taf")
        #endif
    }
}
