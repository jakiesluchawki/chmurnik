import CoreGraphics
import CoreML
import Foundation
import ImageIO
import UniformTypeIdentifiers

func require(_ condition: @autoclosure () -> Bool, _ message: String) {
    if !condition() { fatalError(message) }
}

let constant = try CloudMaskGrid.resized(Array(repeating: Float(0.75), count: 9), from: 3, to: 7)
require(constant.allSatisfy { abs($0 - 0.75) < 1e-6 }, "Resampling preserves constant masks")
let center = try CloudMaskGrid.resized([0, 1, 1, 0], from: 2, to: 1)
require(center == [0.5], "Downsampling uses pixel centers")
let enlarged = try CloudMaskGrid.resized([0, 1, 1, 0], from: 2, to: 4)
require(enlarged[0] == 0 && enlarged[3] == 1 && enlarged[12] == 1 && enlarged[15] == 0,
        "Mask corners remain aligned with the full photograph")
for (values, source, target): ([Float], Int, Int) in [([.nan], 1, 1), ([1.1], 1, 2), ([-0.1], 1, 2),
                                                     ([1], 0, 1), ([1], 1, 513), ([1], 2, 2)] {
    do { _ = try CloudMaskGrid.resized(values, from: source, to: target); fatalError("Invalid mask accepted") }
    catch CloudRegionDetector.DetectorError.invalidOutput { }
}
do { _ = try CloudImagePreprocessor.selectedRegion(data: Data([0, 1, 2])); fatalError("Invalid photo accepted") }
catch CloudImageError.unreadable { }

func encodedImage(width: Int, height: Int) throws -> Data {
    let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
                            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.setFillColor(CGColor(red: 1, green: 0, blue: 0, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    let data = NSMutableData()
    let destination = CGImageDestinationCreateWithData(data, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, context.makeImage()!, nil)
    require(CGImageDestinationFinalize(destination), "Fixture encoding")
    return data as Data
}
let selected = try CloudImagePreprocessor.selectedRegion(data: encodedImage(width: 100, height: 100))
require(selected.width == 100 && selected.height == 100, "Selected square must not be center-cropped again")
do { _ = try CloudImagePreprocessor.selectedRegion(data: encodedImage(width: 100, height: 80)); fatalError("Non-square selection accepted") }
catch CloudImageError.invalidGeometry { }
print("Mask resampling and selected-region preprocessing assertions passed")

if CommandLine.arguments.count == 5 {
    struct Input: Decodable { let id: String; let path: String }
    struct Bounds: Codable, Equatable { let x: Double; let y: Double; let width: Double; let height: Double }
    struct Point: Encodable { let x: Double; let y: Double }
    struct Output: Encodable { let id: String; let regions: [Bounds]; let anchors: [Point]; let seconds: Double }
    let skyPackage = URL(fileURLWithPath: CommandLine.arguments[1])
    let cloudPackage = URL(fileURLWithPath: CommandLine.arguments[2])
    let request = URL(fileURLWithPath: CommandLine.arguments[3])
    let output = URL(fileURLWithPath: CommandLine.arguments[4])
    require(!FileManager.default.fileExists(atPath: output.path), "Preserve existing probe results")
    let skyURL = try MLModel.compileModel(at: skyPackage)
    defer { try? FileManager.default.removeItem(at: skyURL) }
    let cloudURL = try MLModel.compileModel(at: cloudPackage)
    defer { try? FileManager.default.removeItem(at: cloudURL) }
    let config = MLModelConfiguration()
    config.computeUnits = .all
    let detector = try CloudRegionDetector(skyModel: MLModel(contentsOf: skyURL, configuration: config),
                                          cloudModel: MLModel(contentsOf: cloudURL, configuration: config))
    let inputs = try JSONDecoder().decode([Input].self, from: Data(contentsOf: request))
    var rows: [Output] = []
    for input in inputs {
        let row: Output = try autoreleasepool {
            let started = CFAbsoluteTimeGetCurrent()
            let proposals = try detector.detect(imageData: Data(contentsOf: URL(fileURLWithPath: input.path)))
            require(proposals.count <= 5, "Bounded proposal count")
            require(proposals.allSatisfy { CGRect(x: 0, y: 0, width: 1, height: 1).contains($0.bounds) }, "Normalized proposals")
            require(proposals.allSatisfy { region in region.anchor.map { region.bounds.contains($0) } ?? false }, "Anchors inside proposals")
            return Output(id: input.id, regions: proposals.map {
                Bounds(x: $0.bounds.minX, y: $0.bounds.minY, width: $0.bounds.width, height: $0.bounds.height)
            }, anchors: proposals.map { Point(x: $0.anchor!.x, y: $0.anchor!.y) }, seconds: CFAbsoluteTimeGetCurrent() - started)
        }
        rows.append(row)
    }
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    try encoder.encode(rows).write(to: output, options: .atomic)
    print("Both native masks and region proposals completed: \(rows.count) photographs")
} else {
    require(CommandLine.arguments.count == 1, "Arguments: sky.mlpackage cloud.mlpackage request.json output.json")
}
