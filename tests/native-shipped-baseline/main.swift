import CoreML
import Foundation
import UIKit
import Vision

struct Input: Decodable { let id: String; let path: String }
struct Output: Encodable { let id: String; let components: [[Double]]; let seconds: Double }
enum BaselineError: Error { case arguments, image, output, outputExists }

guard CommandLine.arguments.count == 4 else { throw BaselineError.arguments }
let inputs = try JSONDecoder().decode([Input].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
let directory = URL(fileURLWithPath: CommandLine.arguments[2])
let output = URL(fileURLWithPath: CommandLine.arguments[3])
guard !FileManager.default.fileExists(atPath: output.path) else { throw BaselineError.outputExists }
var compiled: [URL] = []
defer { for path in compiled { try? FileManager.default.removeItem(at: path) } }
let configuration = MLModelConfiguration()
configuration.computeUnits = .all
let models = try ["CloudGenusClassifier", "CloudGenusClassifierV3"].map { name -> VNCoreMLModel in
    let path = try MLModel.compileModel(at: directory.appendingPathComponent(name + ".mlpackage"))
    compiled.append(path)
    return try VNCoreMLModel(for: MLModel(contentsOf: path, configuration: configuration))
}

// Exact UIImage/UIGraphicsImageRenderer geometry from the shipped plugin.
func shippedCrop(_ data: Data) throws -> CGImage {
    guard let source = UIImage(data: data) else { throw BaselineError.image }
    let side = floor(min(source.size.width, source.size.height) * 0.902)
    guard side > 0 else { throw BaselineError.image }
    let origin = CGPoint(x: (source.size.width - side) / 2, y: (source.size.height - side) / 2)
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1
    format.opaque = true
    let renderer = UIGraphicsImageRenderer(size: CGSize(width: side, height: side), format: format)
    guard let result = renderer.image(actions: { _ in source.draw(at: CGPoint(x: -origin.x, y: -origin.y)) }).cgImage else {
        throw BaselineError.image
    }
    return result
}

var results: [Output] = []
for (index, entry) in inputs.enumerated() {
    let value: Output = try autoreleasepool {
        let started = CFAbsoluteTimeGetCurrent()
        let image = try shippedCrop(Data(contentsOf: URL(fileURLWithPath: entry.path)))
        let components = try models.map { model -> [Double] in
            let request = VNCoreMLRequest(model: model)
            request.imageCropAndScaleOption = .scaleFill
            try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
            guard let observation = request.results?.first as? VNCoreMLFeatureValueObservation,
                  let probabilities = observation.featureValue.multiArrayValue, probabilities.count == 11 else {
                throw BaselineError.output
            }
            let values = (0..<11).map { probabilities[$0].doubleValue }
            guard values.allSatisfy({ $0.isFinite && $0 >= 0 }), abs(values.reduce(0, +) - 1) < 0.01 else {
                throw BaselineError.output
            }
            return values
        }
        return Output(id: entry.id, components: components, seconds: CFAbsoluteTimeGetCurrent() - started)
    }
    results.append(value)
    if index % 50 == 0 { print("Native shipped baseline: \(index + 1)/\(inputs.count)") }
}
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
try encoder.encode(results).write(to: output, options: .atomic)
print("Native shipped baseline completed: \(results.count)")
