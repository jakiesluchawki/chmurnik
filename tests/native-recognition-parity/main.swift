import CoreML
import CryptoKit
import Foundation
import Vision
#if MAC_IMPORT_JPEG
import ImageIO
import UIKit
#endif

struct Input: Decodable {
    let id: String
    let path: String
}

struct Prediction: Encodable {
    let id: String
    let probabilities: [Double]
    let seconds: Double
    let bounds: [Double]
    let inputSHA256: String
    let inputByteCount: Int
}

enum ParityError: Error {
    case invalidArguments, invalidModel, invalidOutput, outputExists
}

func recognitionData(at url: URL) throws -> Data {
    #if MAC_IMPORT_JPEG
    let fileSize = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
    guard fileSize > 0, fileSize <= 30 * 1024 * 1024,
          let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: 1800,
          ] as CFDictionary),
          let data = UIImage(cgImage: image).jpegData(compressionQuality: 0.86) else {
        throw CloudImageError.unreadable
    }
    return data
    #else
    return try Data(contentsOf: url)
    #endif
}

guard CommandLine.arguments.count == 4 else { throw ParityError.invalidArguments }
let inputs = try JSONDecoder().decode([Input].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
let source = URL(fileURLWithPath: CommandLine.arguments[2])
let output = URL(fileURLWithPath: CommandLine.arguments[3])
guard !FileManager.default.fileExists(atPath: output.path) else { throw ParityError.outputExists }
let compiled = source.pathExtension == "mlmodelc" ? source : try MLModel.compileModel(at: source)
defer {
    if compiled != source { try? FileManager.default.removeItem(at: compiled) }
}
let config = MLModelConfiguration()
config.computeUnits = .all
let model = try MLModel(contentsOf: compiled, configuration: config)
guard let metadata = model.modelDescription.metadata[.creatorDefinedKey] as? [String: String],
      let size = Int(metadata["input_size"] ?? ""),
      let fraction = Double(metadata["crop_fraction"] ?? ""),
      model.modelDescription.inputDescriptionsByName["image"]?.imageConstraint?.pixelsWide == size else {
    throw ParityError.invalidModel
}
let vision = try VNCoreMLModel(for: model)
var predictions: [Prediction] = []
for entry in inputs {
    let result: Prediction = try autoreleasepool {
        let started = CFAbsoluteTimeGetCurrent()
        let data = try recognitionData(at: URL(fileURLWithPath: entry.path))
        let original = try CloudImagePreprocessor.orientedImage(data: data)
        #if REFERENCE_BILINEAR
        let prepared = try ReferenceBilinear.modelInput(original, size: size, fraction: fraction)
        #else
        let prepared = try CloudImagePreprocessor.modelInput(original, size: size, fraction: fraction)
        #endif
        let request = VNCoreMLRequest(model: vision)
        request.imageCropAndScaleOption = .scaleFill
        try VNImageRequestHandler(cgImage: prepared.image, options: [:]).perform([request])
        guard let observation = request.results?.first as? VNCoreMLFeatureValueObservation,
              let values = observation.featureValue.multiArrayValue, values.count == 11 else {
            throw ParityError.invalidOutput
        }
        let probabilities = (0..<11).map { values[$0].doubleValue }
        guard probabilities.allSatisfy({ $0.isFinite && $0 >= 0 }),
              abs(probabilities.reduce(0, +) - 1) < 0.01 else { throw ParityError.invalidOutput }
        let bounds = prepared.bounds
        return Prediction(id: entry.id, probabilities: probabilities,
                          seconds: CFAbsoluteTimeGetCurrent() - started,
                          bounds: [bounds.minX, bounds.minY, bounds.width, bounds.height],
                          inputSHA256: SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
                          inputByteCount: data.count)
    }
    predictions.append(result)
}
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
try encoder.encode(predictions).write(to: output, options: .atomic)
print("Native Vision predictions completed: \(predictions.count)")
