import Foundation

enum ObservationVaultError: Error {
    case invalidData, missingPhoto, tooManyEntries
}

// Called only on the plugin's serial queue. Photos commit before the atomic index.
final class ObservationVaultStore {
    let root: URL
    private let files = FileManager.default

    init(root: URL) throws {
        self.root = root
        try files.createDirectory(at: root.appendingPathComponent("photos"), withIntermediateDirectories: true)
    }

    func snapshot() throws -> (entries: [[String: Any]], migrated: Bool) {
        let index = root.appendingPathComponent("index.json")
        guard files.fileExists(atPath: index.path) else { return ([], false) }
        let data = try Data(contentsOf: index)
        guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              object["schema"] as? Int == 1, let entries = object["entries"] as? [[String: Any]],
              entries.count <= 500 else { throw ObservationVaultError.invalidData }
        for entry in entries { try validate(entry) }
        guard Set(entries.compactMap { $0["id"] as? String }).count == entries.count else { throw ObservationVaultError.invalidData }
        return (entries, object["migrated"] as? Bool ?? false)
    }

    func photoURL(_ name: String) throws -> URL {
        guard name.hasSuffix(".jpg"), UUID(uuidString: String(name.dropLast(4))) != nil else { throw ObservationVaultError.invalidData }
        return root.appendingPathComponent("photos").appendingPathComponent(name)
    }

    func list() throws -> (entries: [[String: Any]], migrated: Bool) {
        let state = try snapshot()
        let entries = try state.entries.map { entry -> [String: Any] in
            var value = entry
            if let name = entry["photoFile"] as? String {
                let url = try photoURL(name)
                value["photoURI"] = url.absoluteString
                value["hasPhoto"] = true
            } else { value["hasPhoto"] = false }
            value.removeValue(forKey: "photoFile")
            return value
        }
        return (entries, state.migrated)
    }

    private func validate(_ entry: [String: Any]) throws {
        guard let id = entry["id"] as? String, !id.isEmpty, id.count <= 100,
              let date = entry["date"] as? String, date.range(of: "^\\d{4}-\\d{2}-\\d{2}$", options: .regularExpression) != nil,
              let created = entry["createdAt"] as? Double, created.isFinite, created >= 0,
              JSONSerialization.isValidJSONObject(entry) else { throw ObservationVaultError.invalidData }
        for key in ["cloud", "confidence", "location", "evidence"] {
            guard let text = entry[key] as? String, text.count <= 4000 else { throw ObservationVaultError.invalidData }
        }
        if let name = entry["photoFile"] as? String { _ = try photoURL(name) }
    }

    private func metadata(_ entry: [String: Any]) throws -> [String: Any] {
        let keys = ["id", "date", "createdAt", "cloud", "confidence", "location", "evidence", "hypothesis", "confirmedCloudId", "favorite"]
        let value = entry.filter { keys.contains($0.key) }
        try validate(value)
        return value
    }

    private func commit(_ entries: [[String: Any]], migrated: Bool) throws {
        let data = try JSONSerialization.data(withJSONObject: ["schema": 1, "migrated": migrated, "entries": entries], options: [.sortedKeys])
        let index = root.appendingPathComponent("index.json")
        if files.fileExists(atPath: index.path) {
            try Data(contentsOf: index).write(to: root.appendingPathComponent("index.previous.json"), options: .atomic)
        }
        try data.write(to: index, options: .atomic)
    }

    func save(_ entry: [String: Any], jpeg: Data?) throws {
        let state = try snapshot()
        var entries = state.entries
        var value = try metadata(entry)
        let oldIndex = entries.firstIndex { ($0["id"] as? String) == (value["id"] as? String) }
        guard oldIndex != nil || entries.count < 500 else { throw ObservationVaultError.tooManyEntries }
        let oldPhoto = oldIndex.flatMap { entries[$0]["photoFile"] as? String }
        var newPhoto: URL?
        if let jpeg {
            let name = UUID().uuidString + ".jpg"
            let url = try photoURL(name)
            try jpeg.write(to: url, options: .atomic)
            newPhoto = url
            value["photoFile"] = name
        } else if let oldPhoto { value["photoFile"] = oldPhoto }
        if let oldIndex { entries[oldIndex] = value } else { entries.append(value) }
        do { try commit(entries, migrated: state.migrated) }
        catch { if let newPhoto { try? files.removeItem(at: newPhoto) }; throw error }
        // Keep replaced evidence for recovery; no source capture or legacy data is deleted.
    }

    func merge(_ incoming: [[String: Any]], migrate: Bool, preparePhoto: ([String: Any]) throws -> Data?) throws {
        let state = try snapshot()
        var entries = state.entries
        var known = Set(entries.compactMap { $0["id"] as? String })
        var created: [URL] = []
        do {
            for entry in incoming {
                var value = try metadata(entry)
                guard let id = value["id"] as? String else { throw ObservationVaultError.invalidData }
                if known.contains(id) { continue }
                guard entries.count < 500 else { throw ObservationVaultError.tooManyEntries }
                if let jpeg = try preparePhoto(entry) {
                    let name = UUID().uuidString + ".jpg"
                    let url = try photoURL(name)
                    try jpeg.write(to: url, options: .atomic)
                    created.append(url); value["photoFile"] = name
                }
                entries.append(value); known.insert(id)
            }
            try commit(entries, migrated: state.migrated || migrate)
        } catch {
            for url in created { try? files.removeItem(at: url) }
            throw error
        }
    }

    func remove(id: String) throws {
        let state = try snapshot()
        let removed = state.entries.first { $0["id"] as? String == id }
        try commit(state.entries.filter { $0["id"] as? String != id }, migrated: state.migrated)
        if let name = removed?["photoFile"] as? String { try? files.removeItem(at: photoURL(name)) }
    }

    // Each file is below the importer limit; only one photo is expanded at a time.
    func exportParts(to directory: URL) throws -> [URL] {
        let state = try snapshot()
        try files.createDirectory(at: directory, withIntermediateDirectories: true)
        var parts: [URL] = []
        var handle: FileHandle?
        var size = 0
        var first = true
        defer { try? handle?.close() }
        for entry in state.entries {
            var full = try metadata(entry)
            full["photo"] = NSNull()
            if let name = entry["photoFile"] as? String {
                let photo = try Data(contentsOf: photoURL(name))
                full["photo"] = "data:image/jpeg;base64," + photo.base64EncodedString()
            }
            let data = try JSONSerialization.data(withJSONObject: full, options: [.sortedKeys])
            if handle == nil || size + data.count > 30_000_000 {
                if let handle { try handle.write(contentsOf: Data("]}".utf8)); try handle.close() }
                let url = directory.appendingPathComponent("chmurnik-moje-niebo-\(parts.count + 1).json")
                let header = "{\"kind\":\"chmurnik-observations\",\"version\":2,\"exportedAt\":\"\(ISO8601DateFormatter().string(from: Date()))\",\"entries\":["
                try Data(header.utf8).write(to: url, options: .atomic)
                handle = try FileHandle(forWritingTo: url); try handle?.seekToEnd()
                parts.append(url); size = header.utf8.count; first = true
            }
            if !first { try handle?.write(contentsOf: Data(",".utf8)) }
            try handle?.write(contentsOf: data); size += data.count + 1; first = false
        }
        if let handle { try handle.write(contentsOf: Data("]}".utf8)); try handle.close() }
        return parts
    }
}
