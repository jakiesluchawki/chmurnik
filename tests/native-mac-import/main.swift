import CryptoKit
import Foundation
import ImageIO
import UIKit

struct Input: Decodable {
    let id: String
    let path: String
}

struct Receipt: Encodable {
    let id: String
    let sourceSHA256: String
    let file: String
    let encodedSHA256: String
    let encodedBytes: Int
}

enum ImportError: Error {
    case invalidArguments, existingOutput, invalidInputs, unreadable
}

func digest(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}

guard CommandLine.arguments.count == 3 else { throw ImportError.invalidArguments }
let inputs = try JSONDecoder().decode([Input].self,
    from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
guard !inputs.isEmpty, Set(inputs.map(\.id)).count == inputs.count else { throw ImportError.invalidInputs }
let output = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
guard !FileManager.default.fileExists(atPath: output.path) else { throw ImportError.existingOutput }
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: false)
var receipts: [Receipt] = []
for (index, input) in inputs.enumerated() {
    let receipt: Receipt = try autoreleasepool {
        let url = URL(fileURLWithPath: input.path)
        let fileSize = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        // Same ImageIO/UIKit preparation as CloudRecognizerPlugin.documentPicker.
        guard fileSize > 0, fileSize <= 30 * 1024 * 1024,
              let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 1800,
              ] as CFDictionary),
              let data = UIImage(cgImage: image).jpegData(compressionQuality: 0.86) else {
            throw ImportError.unreadable
        }
        let name = String(format: "%05d.jpg", index)
        try data.write(to: output.appendingPathComponent(name), options: .withoutOverwriting)
        return Receipt(id: input.id, sourceSHA256: digest(try Data(contentsOf: url)),
                       file: name, encodedSHA256: digest(data), encodedBytes: data.count)
    }
    receipts.append(receipt)
}
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
try encoder.encode(receipts).write(to: output.appendingPathComponent("receipts.json"), options: .withoutOverwriting)
print("Prepared \(receipts.count) Mac-import JPEGs")
