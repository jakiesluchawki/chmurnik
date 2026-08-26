import Foundation

func check(_ condition: @autoclosure () throws -> Bool) {
    do { let passed = try condition(); precondition(passed, "Vault check failed") }
    catch { fatalError("Unexpected storage error: \(error)") }
}

let root = FileManager.default.temporaryDirectory.appendingPathComponent("chmurnik-vault-test-" + UUID().uuidString)
defer { try? FileManager.default.removeItem(at: root) }
let vault = try ObservationVaultStore(root: root)
let entry: [String: Any] = ["id": "one", "date": "2026-08-26", "createdAt": 1782000000000.0, "location": "", "evidence": "", "cloud": "Nierozpoznana", "confidence": "niska", "confirmedCloudId": NSNull(), "favorite": false]
check(try vault.snapshot().entries.isEmpty)
do {
    try vault.merge([entry, entry.merging(["id": "two"]) { _, new in new }], migrate: true) { item in
        if item["id"] as? String == "two" { throw ObservationVaultError.invalidData }
        return Data("jpeg-fixture".utf8)
    }
    fatalError("Interrupted migration should fail")
} catch {}
check(try vault.snapshot().entries.isEmpty)
check(try !vault.snapshot().migrated)
check(try FileManager.default.contentsOfDirectory(atPath: root.appendingPathComponent("photos").path).isEmpty)
try vault.merge([entry], migrate: true) { _ in Data("jpeg-fixture".utf8) }
check(try vault.snapshot().migrated)
try vault.merge([entry], migrate: true) { _ in fatalError("Duplicates must not rewrite images") }
let original = try vault.snapshot().entries[0]["photoFile"] as! String
try vault.save(entry.merging(["favorite": true]) { _, new in new }, jpeg: nil)
check(try vault.snapshot().entries[0]["photoFile"] as? String == original)
check(try vault.snapshot().entries[0]["favorite"] as? Bool == true)
check(try vault.list().entries[0]["hasPhoto"] as? Bool == true)
check(try vault.list().entries[0]["photoURI"] as? String == vault.photoURL(original).absoluteString)
// Simulate an unwritable backup path after the new photo has been staged.
let previousIndex = root.appendingPathComponent("index.previous.json")
try FileManager.default.removeItem(at: previousIndex)
try FileManager.default.createDirectory(at: previousIndex, withIntermediateDirectories: true)
do {
    try vault.save(entry.merging(["favorite": false]) { _, new in new }, jpeg: Data("replacement".utf8))
    fatalError("Failed index commit should fail the save")
} catch {}
check(try vault.snapshot().entries[0]["favorite"] as? Bool == true)
check(try vault.snapshot().entries[0]["photoFile"] as? String == original)
check(try FileManager.default.contentsOfDirectory(atPath: root.appendingPathComponent("photos").path).count == 1)
try FileManager.default.removeItem(at: previousIndex)
do { _ = try vault.photoURL("../../something.jpg"); fatalError("Path escape accepted") } catch {}
let parts = try vault.exportParts(to: root.appendingPathComponent("export"))
let backup = try JSONSerialization.jsonObject(with: Data(contentsOf: parts[0])) as! [String: Any]
assert(backup["version"] as? Int == 2)
let exported = (backup["entries"] as! [[String: Any]])[0]
assert((exported["photo"] as! String).hasPrefix("data:image/jpeg;base64,"))
assert(exported["photoFile"] == nil)
try vault.remove(id: "one")
check(try vault.snapshot().entries.isEmpty)
check(!FileManager.default.fileExists(atPath: try vault.photoURL(original).path))
try Data("broken-json".utf8).write(to: root.appendingPathComponent("index.json"))
do { _ = try vault.snapshot(); fatalError("Corrupt storage must not be reset to empty") } catch {}
let large = try ObservationVaultStore(root: root.appendingPathComponent("large"))
let many = (0..<500).map { index in entry.merging(["id": "entry-\(index)"]) { _, new in new } }
try large.merge(many, migrate: true) { _ in nil }
do { try large.save(entry, jpeg: Data("new".utf8)); fatalError("Collection limit was ignored") } catch {}
check(try large.snapshot().entries.count == 500)
print("PASS: atomic migration, photo and index write failures, deduplication, photo preservation, path validation, backup export, deletion, limits, corruption handling")
