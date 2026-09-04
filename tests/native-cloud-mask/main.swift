import CoreML
import CoreVideo
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct Input: Decodable { let id: String; let path: String }
struct Output: Encodable {
    let id: String
    let input: String
    let mask: String
    let width: Int
    let height: Int
    let seconds: Double
}
enum ProbeError: Error { case arguments, outputExists, image, prediction }

guard CommandLine.arguments.count == 4 else { throw ProbeError.arguments }
let entries = try JSONDecoder().decode([Input].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
let package = URL(fileURLWithPath: CommandLine.arguments[2])
let output = URL(fileURLWithPath: CommandLine.arguments[3], isDirectory: true)
guard !FileManager.default.fileExists(atPath: output.path) else { throw ProbeError.outputExists }
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let compiled = try MLModel.compileModel(at: package)
defer { try? FileManager.default.removeItem(at: compiled) }
let configuration = MLModelConfiguration()
configuration.computeUnits = .all
let model = try MLModel(contentsOf: compiled, configuration: configuration)
var rows: [Output] = []

for (index, entry) in entries.enumerated() {
    let row: Output = try autoreleasepool {
        let started = CFAbsoluteTimeGetCurrent()
        let original = try CloudImagePreprocessor.orientedImage(data: Data(contentsOf: URL(fileURLWithPath: entry.path)))
        let image = try CloudImagePreprocessor.resized(original, width: 256, height: 256)
        let inputPath = output.appendingPathComponent(String(format: "%03d-input.png", index))
        guard let destination = CGImageDestinationCreateWithURL(inputPath as CFURL, UTType.png.identifier as CFString, 1, nil) else {
            throw ProbeError.image
        }
        CGImageDestinationAddImage(destination, image, nil)
        guard CGImageDestinationFinalize(destination) else { throw ProbeError.image }
        let feature = try MLFeatureValue(cgImage: image, pixelsWide: 256, pixelsHigh: 256,
                                         pixelFormatType: kCVPixelFormatType_32BGRA, options: nil)
        let prediction = try model.prediction(from: MLDictionaryFeatureProvider(dictionary: ["image": feature]))
        guard let array = prediction.featureValue(for: "cloud")?.multiArrayValue,
              array.count == 256 * 256 else { throw ProbeError.prediction }
        let values = (0..<array.count).map { array[$0].floatValue }
        guard values.allSatisfy({ $0.isFinite && $0 >= 0 && $0 <= 1 }) else { throw ProbeError.prediction }
        let maskPath = output.appendingPathComponent(String(format: "%03d-mask.f32", index))
        try values.withUnsafeBytes { try Data($0).write(to: maskPath, options: .atomic) }
        return Output(id: entry.id, input: inputPath.path, mask: maskPath.path,
                      width: original.width, height: original.height, seconds: CFAbsoluteTimeGetCurrent() - started)
    }
    rows.append(row)
}
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
try encoder.encode(rows).write(to: output.appendingPathComponent("results.json"), options: .atomic)
print("Original-photo native cloud-mask probe completed: \(rows.count)")
