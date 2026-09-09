import XCTest

final class AppStoreUITests: XCTestCase {
    private let app = ProcessInfo.processInfo.environment["CHMURNIK_QA_APP_ID"] == "cloud.chmurnik.qa.v4.development"
        ? XCUIApplication(bundleIdentifier: "cloud.chmurnik.qa.v4.development") : XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        #if targetEnvironment(macCatalyst)
        guard ProcessInfo.processInfo.environment["CHMURNIK_QA_APP_ID"] == "cloud.chmurnik.qa.v4.development" else {
            throw XCTSkip("Mac UI tests require the isolated QA plan; never launch the production app")
        }
        #else
        // A failed rotation test must not change the next test's starting layout.
        XCUIDevice.shared.orientation = .portrait
        #endif
        app.launchArguments = ["-AppleLanguages", "(pl)", "-AppleLocale", "pl_PL"]
        app.launch()
        #if targetEnvironment(macCatalyst)
        app.activate()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 15))
        #endif
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 45))
        // A native WKWebView exists before the bundled React interface is ready.
        let initialControl = app.buttons.matching(NSPredicate(format: "label IN %@", ["Pomiń", "Dziś"])).firstMatch
        XCTAssertTrue(initialControl.waitForExistence(timeout: 45), "The bundled interface did not render")
        #if !targetEnvironment(macCatalyst)
        rotateTablet(landscape: false)
        #endif
        let skip = app.buttons["Pomiń"].firstMatch
        if skip.exists {
            #if targetEnvironment(macCatalyst)
            tap("Pomiń")
            #else
            skip.tap()
            #endif
        }
    }

    override func tearDownWithError() throws {
        #if targetEnvironment(macCatalyst)
        if ProcessInfo.processInfo.environment["CHMURNIK_QA_APP_ID"] == "cloud.chmurnik.qa.v4.development" {
            app.terminate()
        }
        #endif
    }

    private func button(_ label: String) -> XCUIElement {
        let controls = app.descendants(matching: .any).matching(NSPredicate(
            format: "(elementType == %d OR elementType == %d) AND label == %@",
            XCUIElement.ElementType.button.rawValue,
            XCUIElement.ElementType.switch.rawValue, label
        ))
        return controls.allElementsBoundByIndex.first(where: { isActionable($0) }) ?? controls.firstMatch
    }

    private func isOnScreen(_ element: XCUIElement) -> Bool {
        let frame = element.frame
        #if targetEnvironment(macCatalyst)
        let viewport = app.windows["SceneWindow"].frame
        #else
        var viewport = app.frame
        // A partially visible lesson card must not be tapped through the fixed bottom navigation.
        if !["Dziś", "Moje niebo", "Atlas", "Warstwy"].contains(element.label) {
            let home = app.buttons["Dziś"].firstMatch
            if home.exists, home.frame.minY > viewport.midY {
                viewport.size.height = min(viewport.height, home.frame.minY - viewport.minY)
            }
        }
        #endif
        return !frame.isEmpty && !frame.isInfinite && viewport.insetBy(dx: 8, dy: 8)
            .contains(CGPoint(x: frame.midX, y: frame.midY))
    }

    private func isActionable(_ element: XCUIElement) -> Bool {
        // WebKit can throw while resolving isHittable even for an unobscured button.
        // Tap the settled visible frame instead; each flow asserts the resulting UI state.
        return isOnScreen(element) && element.isEnabled
    }

    private func tap(_ label: String, contains: Bool = false) {
        let element = contains
            ? app.buttons.matching(NSPredicate(format: "label CONTAINS %@", label)).firstMatch
            : button(label)
        tapElement(element, label: label)
    }

    private func tapElement(_ element: XCUIElement, label: String, maximumScrolls: Int = 8,
                            normalizedOffset: CGVector = CGVector(dx: 0.5, dy: 0.5)) {
        #if targetEnvironment(macCatalyst)
        app.activate()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 15))
        #endif
        XCTAssertTrue(element.waitForExistence(timeout: 15), label)
        for _ in 0..<maximumScrolls {
            // WebKit can fail the test when asked for an off-screen activation point.
            if isActionable(element) { break }
            #if targetEnvironment(macCatalyst)
            let above = element.frame.midY < app.windows["SceneWindow"].frame.minY
            // Scroll inside the modal without relying on keyboard focus after inference.
            app.windows["SceneWindow"].coordinate(withNormalizedOffset: CGVector(dx: 0.84, dy: 0.65))
                .scroll(byDeltaX: 0, deltaY: above ? 380 : -380)
            #else
            if element.frame.minY < 100 { app.webViews.firstMatch.swipeDown() }
            else { app.webViews.firstMatch.swipeUp() }
            #endif
        }
        XCTAssertTrue(isActionable(element), label)
        #if targetEnvironment(macCatalyst)
        element.coordinate(withNormalizedOffset: normalizedOffset).click()
        #else
        // WebKit's activation point can sit on a link's edge while scrolling settles.
        var previousFrame = CGRect.zero
        var stableSince: Date?
        let settled = XCTNSPredicateExpectation(predicate: NSPredicate { [self] _, _ in
            guard element.exists, isActionable(element) else {
                stableSince = nil
                return false
            }
            let frame = element.frame
            if frame != previousFrame || stableSince == nil {
                previousFrame = frame
                stableSince = Date()
            }
            return Date().timeIntervalSince(stableSince!) >= 0.3
        }, object: nil)
        guard XCTWaiter.wait(for: [settled], timeout: 5) == .completed else {
            XCTFail("Unstable tap target: \(label)")
            return
        }
        // Use the settled screen point: resolving a WebKit element coordinate can scroll again.
        let frame = element.frame
        let origin = app.frame.origin
        let point = CGVector(dx: frame.minX + frame.width * normalizedOffset.dx - origin.x,
                             dy: frame.minY + frame.height * normalizedOffset.dy - origin.y)
        print("QA tap \(label): frame=\(frame), screenOffset=\(point)")
        app.coordinate(withNormalizedOffset: .zero).withOffset(point).tap()
        #endif
    }

    private func visibleText(_ text: String) -> Bool {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@ OR value CONTAINS[c] %@", text, text))
            .firstMatch.waitForExistence(timeout: 15)
    }

    private func assertChapter(_ position: Int, of count: Int) {
        let progress = app.descendants(matching: .any).matching(NSPredicate(
            format: "label == %@", "Rozdział \(position) z \(count)"
        )).firstMatch
        XCTAssertTrue(progress.waitForExistence(timeout: 15), app.debugDescription)
    }

    private func returnToFirstChapter(of count: Int) {
        for _ in 0..<count {
            let progress = app.descendants(matching: .any).matching(NSPredicate(
                format: "label BEGINSWITH %@ AND label ENDSWITH %@", "Rozdział ", " z \(count)"
            )).firstMatch
            guard progress.waitForExistence(timeout: 15),
                  let position = Int(progress.label.split(separator: " ").dropFirst().first ?? ""),
                  (1...count).contains(position) else {
                XCTFail("Missing chapter position: \(app.debugDescription)")
                return
            }
            if position == 1 {
                XCTAssertFalse(button("Poprzedni").isEnabled)
                return
            }
            tap("Poprzedni")
            assertChapter(position - 1, of: count)
        }
        XCTFail("Did not reach the first chapter")
    }

    private func capture(_ name: String, fullScreen: Bool = false) {
        #if targetEnvironment(macCatalyst)
        let attachment = XCTAttachment(screenshot: app.windows["SceneWindow"].screenshot())
        #else
        let attachment = XCTAttachment(screenshot: fullScreen ? XCUIScreen.main.screenshot() : app.screenshot())
        #endif
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func rotateTablet(landscape: Bool) {
        XCUIDevice.shared.orientation = landscape ? .landscapeLeft : .portrait
        var stableSince: Date?
        var previousFrame = CGRect.zero
        let resized = XCTNSPredicateExpectation(predicate: NSPredicate { [self] _, _ in
            let frame = app.webViews.firstMatch.frame
            let window = app.frame
            guard !frame.isEmpty, (frame.width > frame.height) == landscape,
                  (window.width > window.height) == landscape else {
                stableSince = nil
                return false
            }
            // WebKit's AX bounds can update before the native rotation has settled.
            if frame != previousFrame || stableSince == nil {
                previousFrame = frame
                stableSince = Date()
            }
            return Date().timeIntervalSince(stableSince!) >= 2
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [resized], timeout: 15), .completed)
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
        XCTAssertTrue(visibleText("Poznaj chmury nad sobą"))
        capture("01-dzis")
        tap("METAR / TAF", contains: true)
        XCTAssertTrue(visibleText("Rozczytaj METAR i TAF"))
        capture("02-metar-taf")
        let input = app.textViews.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        tap("TAF: KLVM bez nagłówka")
        XCTAssertEqual(input.value as? String, "KLVM 261730Z 2618/2718 29008KT P6SM FEW090 BKN200 FM262300 VRB06KT P6SM VCSH SCT100 BKN140 PROB30 2623/2704 VRB25G40KT 6SM -TSRA BKN080CB FM270700 30008KT P6SM SCT100 BKN160")
        XCTAssertTrue(visibleText("Warunki w kolejnych godzinach"))
        XCTAssertFalse(app.staticTexts["Temperatura / punkt rosy"].exists)
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

    func test03PhotoLibraryAndPersistentObservation() throws {
        #if targetEnvironment(macCatalyst)
        throw XCTSkip("Uses the iOS photo picker; test the Mac file picker separately")
        #else
        // Run on an isolated simulator, with camera denied and licensed atlas photos added.
        // This exercises the real picker/model/vault, not physical camera hardware.
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let fullAccess = springboard.buttons["Pełny dostęp"]
        if fullAccess.waitForExistence(timeout: 2) { fullAccess.tap() }
        for attempt in 1...2 {
            tap("Dziś")
            tap("Zrób zdjęcie")
            let permissionAlert = app.alerts["CHMURNIK"]
            if permissionAlert.waitForExistence(timeout: 4) {
                permissionAlert.buttons["OK"].tap()
            }
            XCTAssertTrue(visibleText("[0003]"))
            let gallery = button("Wybierz z biblioteki")
            XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: gallery)], timeout: 20), .completed)
            tap("Wybierz z biblioteki")
            if fullAccess.waitForExistence(timeout: 3) { fullAccess.tap() }
            let done = app.buttons.matching(NSPredicate(format: "label IN %@", ["Done", "Gotowe"])).firstMatch
            XCTAssertTrue(done.waitForExistence(timeout: 15), app.debugDescription + springboard.debugDescription)
            capture("qa-gallery-\(attempt)")
            let photos = app.scrollViews.buttons
            // Reviewed seeded galleries: iPhone fixtures bracket six stock photos; iPad fixtures follow them.
            // Photo metadata dates differ, so import order is not a reliable selection rule.
            XCTAssertEqual(photos.count, 8, "Use the reviewed isolated gallery with six stock photos and two cloud fixtures")
            let firstFixture = app.frame.width < 641 ? 0 : photos.count - 2
            let photo = photos.element(boundBy: attempt == 1 ? firstFixture : photos.count - 1)
            XCTAssertTrue(photo.waitForExistence(timeout: 10), app.debugDescription)
            photo.tap()
            XCTAssertTrue(done.isEnabled)
            done.tap()
            let proposal = button("Zaznacz proponowany fragment 1")
            XCTAssertTrue(proposal.waitForExistence(timeout: 90), app.debugDescription)
            XCTAssertTrue(app.images["Całe własne zdjęcie nieba, bez przycinania"].exists)
            XCTAssertFalse(button("Sprawdź zaznaczony fragment").exists)
            capture("qa-local-proposals-\(attempt)")
            tap("Zaznacz proponowany fragment 1")
            XCTAssertEqual(proposal.value as? String, "1")
            if attempt == 2 {
                let surface = button("Wskaż miejsce na zdjęciu; strzałki przesuwają wybór")
                let markers = app.descendants(matching: .any).matching(NSPredicate(
                    format: "(elementType == %d OR elementType == %d) AND label BEGINSWITH %@",
                    XCUIElement.ElementType.button.rawValue, XCUIElement.ElementType.switch.rawValue,
                    "Zaznacz proponowany fragment"
                )).allElementsBoundByIndex.map { $0.frame.insetBy(dx: -8, dy: -8) }
                // The center can be covered by a proposal marker: touch the photo itself.
                let candidates = [0.25, 0.5, 0.75].flatMap { x in
                    [0.25, 0.5, 0.75].map { y in CGVector(dx: x, dy: y) }
                }
                guard let point = candidates.first(where: { offset in
                    let p = CGPoint(x: surface.frame.minX + surface.frame.width * offset.dx,
                                    y: surface.frame.minY + surface.frame.height * offset.dy)
                    return app.frame.insetBy(dx: 8, dy: 8).contains(p) && !markers.contains { $0.contains(p) }
                }) else {
                    XCTFail("No unobscured point on the photo for manual selection")
                    return
                }
                tapElement(surface, label: "Manual photo selection outside proposal markers", normalizedOffset: point)
                XCTAssertTrue(button("Więcej kontekstu").waitForExistence(timeout: 15), app.debugDescription)
                XCTAssertEqual(proposal.value as? String, "0")
                tap("Więcej kontekstu")
                XCTAssertEqual(button("Więcej kontekstu").value as? String, "1")
                capture("qa-manual-photo-context")
            }
            tap("Sprawdź zaznaczony fragment")
            let details = button("Szczegóły analizy i jej ograniczenia")
            XCTAssertTrue(details.waitForExistence(timeout: 90), app.debugDescription)
            XCTAssertTrue(visibleText("Wynik analizy"))
            tap("Szczegóły analizy i jej ograniczenia")
            XCTAssertTrue(visibleText("3.0-ensemble-selected-region-experimental"), app.debugDescription)
            tap("Szczegóły analizy i jej ograniczenia")
            capture("qa-local-model-\(attempt)")
            tap("Zapisz w Moim niebie")
            XCTAssertTrue(visibleText("Twoje rozpoznanie i notatki"), app.debugDescription)
            tap("Szczegóły zapisanego wyniku")
            XCTAssertTrue(visibleText("3.0-ensemble-selected-region-experimental"), app.debugDescription)
            app.terminate()
            app.launch()
            tap("Moje niebo")
            let observation = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Obserwacja bez rozpoznania")).firstMatch
            XCTAssertTrue(observation.waitForExistence(timeout: 15), app.debugDescription)
            observation.tap()
            XCTAssertTrue(visibleText("Twoje rozpoznanie i notatki"))
            tap("Szczegóły zapisanego wyniku")
            XCTAssertTrue(visibleText("3.0-ensemble-selected-region-experimental"))
            capture("05-moje-niebo-\(attempt)")
        }
        tap("Moje niebo")
        let observations = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Obserwacja bez rozpoznania"))
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in observations.count >= 2 }, object: nil
        )], timeout: 15), .completed, app.debugDescription)
        let date = app.descendants(matching: .any).matching(NSPredicate(
            format: "label == %@ AND elementType != %d", "Data obserwacji",
            XCUIElement.ElementType.staticText.rawValue
        )).firstMatch
        XCTAssertTrue(date.waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertGreaterThan(date.frame.width, 0)
        XCTAssertLessThanOrEqual(date.frame.maxX, app.frame.maxX - 10, app.debugDescription)
        capture("06-kolekcja")
        #endif
    }

    func test04UsefulToolScreens() {
        tap("METAR / TAF", contains: true)
        tap("TAF: KLVM bez nagłówka")
        scrollToHeading("Warunki w kolejnych godzinach")
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
        capture("ipad-portrait-home", fullScreen: true)
        rotateTablet(landscape: true)
        tap("Atlas")
        tap("Cirrus, pierzaste", contains: true)
        XCTAssertTrue(visibleText("PiccoloNamek"))
        capture("ipad-landscape-atlas", fullScreen: true)
        rotateTablet(landscape: false)
        XCTAssertTrue(visibleText("PiccoloNamek"))
        capture("ipad-portrait-atlas", fullScreen: true)
        rotateTablet(landscape: true)
        tap("Zamknij kartę")
        tap("METAR i TAF")
        tap("TAF: KLVM bez nagłówka")
        XCTAssertTrue(visibleText("Warunki w kolejnych godzinach"))
        capture("ipad-landscape-taf", fullScreen: true)
        #endif
    }

    func test06FullLessonsAndSavedChapter() throws {
        #if targetEnvironment(macCatalyst)
        throw XCTSkip("Uses compact phone chapter navigation")
        #else
        guard app.frame.width < 641 else { throw XCTSkip("Compact phone only") }
        tap("Pełne lekcje")
        tap("Chmury w METAR i TAF", contains: true)
        XCTAssertTrue(button("Poprzedni").waitForExistence(timeout: 15), app.debugDescription)
        returnToFirstChapter(of: 7)
        assertChapter(1, of: 7)
        for position in 2...7 {
            tap("Następny")
            assertChapter(position, of: 7)
        }
        XCTAssertTrue(visibleText("Czego kod nie mówi"))
        capture("qa-lesson-last-chapter")
        tap("Ścieżka nauki")
        tap("Czytanie atmosfery w pionie", contains: true)
        XCTAssertTrue(button("Poprzedni").waitForExistence(timeout: 15), app.debugDescription)
        returnToFirstChapter(of: 6)
        assertChapter(1, of: 6)
        XCTAssertTrue(visibleText("Trzy różne pytania o wysokość"))
        tap("Następny")
        assertChapter(2, of: 6)
        capture("qa-lesson-shorter-route")
        app.terminate()
        app.launch()
        tap("Dziś")
        tap("Pełne lekcje")
        tap("Czytanie atmosfery w pionie", contains: true)
        assertChapter(2, of: 6)
        capture("qa-lesson-restored-chapter")
        #endif
    }

    func test08CompactNavigationAndDailyReveal() throws {
        #if targetEnvironment(macCatalyst)
        throw XCTSkip("Compact iOS navigation; Mac sidebar is tested separately")
        #else
        verifyNavigationAndDailyReveal()
        #endif
    }

    func test09MacNavigationAndDailyReveal() throws {
        #if targetEnvironment(macCatalyst)
        verifyNavigationAndDailyReveal(layersLabel: "Mapy i warstwy")
        #else
        throw XCTSkip("Isolated Mac QA only")
        #endif
    }

    func test10BundledWorkshopAndLessonRoundTrip() {
        let compactLesson = app.frame.width < 641
        tap("Dziś")
        tap("Pełne lekcje")
        tap("Dlaczego chmura powstaje", contains: true)
        if compactLesson {
            XCTAssertTrue(button("Poprzedni").waitForExistence(timeout: 15), app.debugDescription)
            returnToFirstChapter(of: 5)
            assertChapter(1, of: 5)
            tap("Następny")
            assertChapter(2, of: 5)
        } else {
            XCTAssertTrue(visibleText("Unoszenie i chłodzenie adiabatyczne"))
            XCTAssertFalse(button("Następny").exists)
        }
        let workshop = app.links.matching(NSPredicate(format: "label CONTAINS %@", "Kiedy pojawi się chmura?")).firstMatch
        tapElement(workshop, label: "Pracownia kondensacji w paczce aplikacji")
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 15))
        XCTAssertTrue(button("Swobodnie").waitForExistence(timeout: 30), app.debugDescription)
        tap("Swobodnie")
        XCTAssertTrue(visibleText("Początkowo 24,0°C"))
        tap("Zwiększ: Uniesienie powietrza")
        XCTAssertTrue(visibleText("100 m"))
        capture("native-bundled-workshop-cloud-action")
        tap("Sprawdź się")
        XCTAssertTrue(button("Przypomnij zasadę").waitForExistence(timeout: 15))
        XCTAssertFalse(button("Zwiększ: Uniesienie powietrza").exists)
        capture("native-bundled-workshop-independent-case")
        tapElement(app.links["Lekcja"].firstMatch, label: "Powrót z pracowni do lekcji")
        if compactLesson { assertChapter(2, of: 5) }
        XCTAssertTrue(visibleText("Unoszenie i chłodzenie adiabatyczne"))
        capture("native-workshop-restores-lesson-chapter")
        app.terminate()
        app.launch()
        tap("Dziś")
        tap("Pełne lekcje")
        tap("Dlaczego chmura powstaje", contains: true)
        if compactLesson { assertChapter(2, of: 5) }
        else { XCTAssertTrue(visibleText("Unoszenie i chłodzenie adiabatyczne")) }
    }

    func test11EveryBundledWorkshopOpensAndReturnsToCatalog() {
        tap("Dziś")
        tap("Pełne lekcje")
        tap("Dlaczego chmura powstaje", contains: true)
        tapElement(app.links.matching(NSPredicate(format: "label CONTAINS %@", "Kiedy pojawi się chmura?")).firstMatch,
                   label: "Wejście do lokalnej pracowni")
        tapElement(app.links["Pracownia"].firstMatch, label: "Katalog pracowni")
        let workshops = [
            "Dlaczego wiatr zawraca nad wybrzeżem?", "Kiedy unoszona porcja staje się chmurą?",
            "Jak nocne ochłodzenie prowadzi do mgły?", "Co naprawdę widzisz na zdjęciu?",
            "Poziom i budowa to dwa różne pytania", "Nie dopisuj tego, czego nie zaobserwowałeś",
            "Co unosi powietrze przy froncie?", "Chmura płynie dokąd, wiatr wieje skąd?",
            "Zmień warstwę, odczytaj depeszę", "Ta sama wysokość, inna odległość od gruntu",
            "Najpierw odczytaj jeden poziom", "Mróz to dopiero część warunków",
            "Trzy drogi do nieregularnego przepływu", "Puść porcję powietrza. Co stanie się dalej?"
        ]
        for (index, title) in workshops.enumerated() {
            let card = app.links.matching(NSPredicate(format: "label CONTAINS %@", title)).firstMatch
            // The phone catalogue contains fourteen illustrated cards, beyond eight swipes.
            tapElement(card, label: title, maximumScrolls: 24)
            XCTAssertTrue(app.wait(for: .runningForeground, timeout: 15))
            XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(
                format: "(elementType == %d OR elementType == %d) AND label CONTAINS %@",
                XCUIElement.ElementType.button.rawValue, XCUIElement.ElementType.switch.rawValue,
                "Sprawdź się")).firstMatch.waitForExistence(timeout: 30), title)
            capture("native-workshop-\(index + 1)")
            tapElement(app.links["Pracownia"].firstMatch, label: "Powrót z \(title)")
            XCTAssertTrue(visibleText("Sprawdź, dlaczego niebo się zmienia."))
        }
    }

    private func verifyNavigationAndDailyReveal(layersLabel: String = "Warstwy") {
        tap("Dziś")
        XCTAssertTrue(button(layersLabel).exists)
        XCTAssertFalse(button("Ćwicz rozpoznawanie").exists)
        XCTAssertTrue(visibleText("Jaka to chmura?"))
        tap("Odsłoń odpowiedź")
        XCTAssertTrue(button("Ćwicz rozpoznawanie").exists)
        capture("native-daily-revealed")
        tap("Ukryj odpowiedź")
        XCTAssertFalse(button("Ćwicz rozpoznawanie").exists)
        capture("native-daily-hidden")
        tap(layersLabel)
        XCTAssertTrue(button("Czytnik Windy").waitForExistence(timeout: 15))
        for label in ["Wysokość", "Wiatr z nieba", "METAR / TAF", "Zagrożenia", "Sondaż i Skew-T"] {
            XCTAssertTrue(button(label).exists, label)
        }
        capture("native-layers-tab")
        tap("Rozczytaj depeszę", contains: true)
        XCTAssertTrue(visibleText("Rozczytaj METAR i TAF"))
        XCTAssertTrue(button("Wyjaśnij depeszę").exists)
        tap(layersLabel)
        tap("Oblicz składowe wiatru", contains: true)
        XCTAssertTrue(visibleText("Sprawdź składowe wiatru"))
        tap(layersLabel)
        tap("Zrozum warstwy mapy", contains: true)
        XCTAssertTrue(visibleText("Wszystkie liczby są wymyślone do ćwiczenia"))
        tap(layersLabel)
        tap("Pełne lekcje")
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Czytanie atmosfery w pionie"))
            .firstMatch.waitForExistence(timeout: 15))
    }

    func test07IsolatedMacPhotoAndPersistence() throws {
        #if targetEnvironment(macCatalyst)
        let environment = ProcessInfo.processInfo.environment
        guard environment["CHMURNIK_QA_APP_ID"] == "cloud.chmurnik.qa.v4.development",
              let photo = environment["CHMURNIK_QA_PHOTO"] else {
            throw XCTSkip("Run only through the isolated macOS QA test plan")
        }
        defer { app.terminate() }
        XCTAssertTrue(visibleText("Poznaj chmury nad sobą"))
        capture("mac-qa-home")
        tap("Wybierz zdjęcie nieba")
        let picker = app.sheets["open-panel"]
        XCTAssertTrue(picker.waitForExistence(timeout: 15), app.debugDescription)
        app.typeKey("g", modifierFlags: [.command, .shift])
        let pathField = app.textFields["PathTextField"]
        XCTAssertTrue(pathField.waitForExistence(timeout: 15), app.debugDescription)
        pathField.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).click()
        pathField.typeKey("a", modifierFlags: [.command])
        pathField.typeText(photo)
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value == %@", photo), object: pathField
        )], timeout: 15), .completed, "The full fixture path must arrive before confirming Go To")
        app.typeKey(.return, modifierFlags: [])
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: pathField
        )], timeout: 15), .completed, "Go To must close before opening the selected file")
        // Go To can highlight the file while the Open button remains disabled.
        let selectedFile = app.textFields.matching(NSPredicate(
            format: "value == %@", URL(fileURLWithPath: photo).lastPathComponent
        )).firstMatch
        XCTAssertTrue(selectedFile.waitForExistence(timeout: 15), app.debugDescription)
        selectedFile.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).doubleClick()
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: picker
        )], timeout: 30), .completed, "The native picker must finish before waiting for cloud proposals")
        let proposal = button("Zaznacz proponowany fragment 1")
        XCTAssertTrue(proposal.waitForExistence(timeout: 90), app.debugDescription)
        capture("mac-qa-proposals")
        tap("Zaznacz proponowany fragment 1")
        tap("Sprawdź zaznaczony fragment")
        XCTAssertTrue(button("Szczegóły analizy i jej ograniczenia").waitForExistence(timeout: 90), app.debugDescription)
        tap("Szczegóły analizy i jej ograniczenia")
        XCTAssertTrue(visibleText("3.0-ensemble-selected-region-experimental"))
        tap("Szczegóły analizy i jej ograniczenia")
        capture("mac-qa-result")
        tap("Zapisz w Moim niebie")
        XCTAssertTrue(visibleText("Twoje rozpoznanie i notatki"))
        let note = app.textViews["Notatka"].firstMatch
        XCTAssertTrue(note.waitForExistence(timeout: 15), app.debugDescription)
        let originalNote = try XCTUnwrap(note.value as? String)
        XCTAssertTrue(originalNote.contains("Zachowano całe zdjęcie."))
        let marker = "QA persistence \(UUID().uuidString)"
        tapElement(note, label: "Notatka")
        note.typeKey(.downArrow, modifierFlags: [.command])
        app.typeText("\n" + marker)
        let expectedNote = originalNote + "\n" + marker
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value == %@", expectedNote), object: note
        )], timeout: 10), .completed, app.debugDescription)
        tap("Zapisz zmiany")
        XCTAssertTrue(visibleText("Zmiany zapisane. Oryginalny wynik modelu pozostał bez zmian."))
        app.terminate()
        app.launch()
        tap("Moje niebo")
        let observation = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Obserwacja bez rozpoznania")).firstMatch
        XCTAssertTrue(observation.waitForExistence(timeout: 15), app.debugDescription)
        tap("Obserwacja bez rozpoznania", contains: true)
        XCTAssertTrue(note.waitForExistence(timeout: 15), app.debugDescription)
        XCTAssertEqual(note.value as? String, expectedNote, "The newly saved observation must survive relaunch")
        XCTAssertTrue(app.images.matching(NSPredicate(format: "label BEGINSWITH %@", "Własne zdjęcie nieba,")).firstMatch.waitForExistence(timeout: 15))
        tap("Szczegóły zapisanego wyniku")
        XCTAssertTrue(visibleText("3.0-ensemble-selected-region-experimental"))
        capture("mac-qa-restored-observation")
        #else
        throw XCTSkip("Isolated Mac test only")
        #endif
    }
}
