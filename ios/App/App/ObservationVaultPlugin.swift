import Capacitor
import ImageIO
import UIKit
import UniformTypeIdentifiers

@objc(ObservationVaultPlugin)
final class ObservationVaultPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "ObservationVaultPlugin"
    let jsName = "ObservationVault"
    let pluginMethods: [CAPPluginMethod] = ["list", "save", "merge", "remove", "exportBackup", "shareCard"].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }
    private let queue = DispatchQueue(label: "cloud.chmurnik.observations")
    private var sharing = false

    private func store() throws -> ObservationVaultStore {
        let root = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true).appendingPathComponent("ChmurnikObservations")
        let store = try ObservationVaultStore(root: root)
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: root.path)
        return store
    }

    private func execute(_ call: CAPPluginCall, work: @escaping (ObservationVaultStore) throws -> JSObject) {
        queue.async {
            do { call.resolve(try work(self.store())) }
            catch { call.reject("Nie udało się zapisać lub odczytać kolekcji. Oryginalny dziennik pozostał bez zmian. Sprawdź wolne miejsce i spróbuj ponownie.", "observation-storage", error) }
        }
    }

    private func decodeEntry(_ call: CAPPluginCall) throws -> [String: Any] {
        guard let raw = call.getString("entry"), let data = raw.data(using: .utf8), data.count < 2_000_000,
              let entry = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw ObservationVaultError.invalidData }
        return entry
    }

    private func imageData(_ entry: [String: Any], path: String? = nil, base64: String? = nil) throws -> Data? {
        var source: CGImageSource?
        if let path {
            let url = (URL(string: path)?.isFileURL == true ? URL(string: path)! : URL(fileURLWithPath: path)).resolvingSymlinksInPath().standardizedFileURL
            let home = URL(fileURLWithPath: NSHomeDirectory()).resolvingSymlinksInPath().path + "/"
            guard url.path.hasPrefix(home), let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize, size <= 30_000_000 else { throw ObservationVaultError.invalidData }
            source = CGImageSourceCreateWithURL(url as CFURL, nil)
        } else if let raw = (entry["photo"] as? String) ?? base64 {
            guard raw.count <= 2_000_000, let data = Data(base64Encoded: raw.components(separatedBy: ",").last ?? raw) else { throw ObservationVaultError.invalidData }
            source = CGImageSourceCreateWithData(data as CFData, nil)
        } else { return nil }
        guard let source else { throw ObservationVaultError.invalidData }
        for dimension in [1600, 1080, 800] {
            let options: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceCreateThumbnailWithTransform: true, kCGImageSourceThumbnailMaxPixelSize: dimension]
            guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { throw ObservationVaultError.invalidData }
            let data = NSMutableData()
            guard let destination = CGImageDestinationCreateWithData(data, UTType.jpeg.identifier as CFString, 1, nil) else { throw ObservationVaultError.invalidData }
            // A new destination carries pixels only, without GPS or source EXIF.
            CGImageDestinationAddImage(destination, image, [kCGImageDestinationLossyCompressionQuality: 0.82] as CFDictionary)
            guard CGImageDestinationFinalize(destination) else { throw ObservationVaultError.invalidData }
            if data.length <= 670_000 { return data as Data }
        }
        throw ObservationVaultError.invalidData
    }

    @objc func list(_ call: CAPPluginCall) {
        execute(call) { store in
            let state = try store.list()
            return ["entries": state.entries, "migrated": state.migrated]
        }
    }

    @objc func save(_ call: CAPPluginCall) {
        execute(call) { store in
            let entry = try self.decodeEntry(call)
            try store.save(entry, jpeg: self.imageData(entry, path: call.getString("photoPath"), base64: call.getString("photoBase64")))
            return [:]
        }
    }

    @objc func merge(_ call: CAPPluginCall) {
        execute(call) { store in
            guard let raw = call.getString("entries"), let data = raw.data(using: .utf8), data.count <= 50_000_000,
                  let entries = try JSONSerialization.jsonObject(with: data) as? [[String: Any]], entries.count <= 500 else { throw ObservationVaultError.invalidData }
            try store.merge(entries, migrate: call.getBool("migrate") ?? false, preparePhoto: { try self.imageData($0) })
            return [:]
        }
    }

    @objc func remove(_ call: CAPPluginCall) {
        execute(call) { store in
            guard let id = call.getString("id") else { throw ObservationVaultError.invalidData }
            try store.remove(id: id)
            return [:]
        }
    }

    private func presentShare(_ urls: [URL], directory: URL, call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard !urls.isEmpty, !self.sharing, let presenter = self.bridge?.viewController,
                  presenter.presentedViewController == nil else {
                try? FileManager.default.removeItem(at: directory)
                call.reject("Zamknij otwarte okno i spróbuj ponownie.", "share-busy"); return
            }
            self.sharing = true
            let sheet = UIActivityViewController(activityItems: urls, applicationActivities: nil)
            sheet.popoverPresentationController?.sourceView = presenter.view
            sheet.popoverPresentationController?.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.maxY - 60, width: 1, height: 1)
            sheet.completionWithItemsHandler = { _, completed, _, error in
                self.sharing = false
                try? FileManager.default.removeItem(at: directory)
                if let error { call.reject("Nie udało się udostępnić pliku.", "share-failed", error) }
                else { call.resolve(["shared": completed]) }
            }
            presenter.present(sheet, animated: true)
        }
    }

    @objc func exportBackup(_ call: CAPPluginCall) {
        queue.async {
            let directory = FileManager.default.temporaryDirectory.appendingPathComponent("chmurnik-export-" + UUID().uuidString)
            do {
                let urls = try self.store().exportParts(to: directory)
                self.presentShare(urls, directory: directory, call: call)
            } catch {
                try? FileManager.default.removeItem(at: directory)
                call.reject("Nie udało się przygotować kompletnej kopii. Żadne obserwacje nie zostały usunięte.", "export-failed", error)
            }
        }
    }

    @objc func shareCard(_ call: CAPPluginCall) {
        queue.async {
            let directory = FileManager.default.temporaryDirectory.appendingPathComponent("chmurnik-card-" + UUID().uuidString)
            do {
                guard let raw = call.getString("dataUrl"), let jpeg = try self.imageData(["photo": raw]) else { throw ObservationVaultError.invalidData }
                try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
                let url = directory.appendingPathComponent("chmurnik-obserwacja.jpg")
                try jpeg.write(to: url, options: .atomic)
                self.presentShare([url], directory: directory, call: call)
            } catch {
                try? FileManager.default.removeItem(at: directory)
                call.reject("Nie udało się przygotować pocztówki.", "share-failed", error)
            }
        }
    }
}
