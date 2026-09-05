import CoreGraphics
import CoreML
import CoreVideo
import Foundation

enum CloudMaskGrid {
    static func resized(_ values: [Float], from source: Int, to target: Int) throws -> [Float] {
        guard (1...512).contains(source), (1...512).contains(target),
              values.count == source * source,
              values.allSatisfy({ $0.isFinite && $0 >= 0 && $0 <= 1 }) else {
            throw CloudRegionDetector.DetectorError.invalidOutput
        }
        if source == target { return values }
        return (0..<(target * target)).map { index in
            let x = max(0, min(Float(source - 1), (Float(index % target) + 0.5) * Float(source) / Float(target) - 0.5))
            let y = max(0, min(Float(source - 1), (Float(index / target) + 0.5) * Float(source) / Float(target) - 0.5))
            let left = Int(x), top = Int(y)
            let right = min(source - 1, left + 1), bottom = min(source - 1, top + 1)
            let dx = x - Float(left), dy = y - Float(top)
            let upper = values[top * source + left] * (1 - dx) + values[top * source + right] * dx
            let lower = values[bottom * source + left] * (1 - dx) + values[bottom * source + right] * dx
            return upper * (1 - dy) + lower * dy
        }
    }
}

/// Two masks locate selectable areas. Neither model assigns a cloud genus.
final class CloudRegionDetector {
    enum DetectorError: Error { case modelMissing, invalidOutput }
    private let skyModel: MLModel
    private let cloudModel: MLModel

    init(skyModel: MLModel, cloudModel: MLModel) {
        self.skyModel = skyModel
        self.cloudModel = cloudModel
    }

    convenience init(bundle: Bundle = .main) throws {
        func load(_ name: String) throws -> MLModel {
            guard let url = bundle.url(forResource: name, withExtension: "mlmodelc") else {
                throw DetectorError.modelMissing
            }
            let configuration = MLModelConfiguration()
            configuration.computeUnits = .all
            return try MLModel(contentsOf: url, configuration: configuration)
        }
        try self.init(skyModel: load("SkySegmentation"), cloudModel: load("CloudMaskV4Research"))
    }

    func detect(imageData: Data) throws -> [CloudRegionProposal] {
        let image = try CloudImagePreprocessor.orientedImage(data: imageData)
        let sky = try mask(model: skyModel, image: image, size: 384, output: "sky")
        let cloud = try mask(model: cloudModel, image: image, size: 256, output: "cloud")
        return try CloudRegionProposer.propose(cloudScores: cloud,
            skyScores: CloudMaskGrid.resized(sky, from: 384, to: 256), columns: 256, rows: 256)
    }

    private func mask(model: MLModel, image: CGImage, size: Int, output: String) throws -> [Float] {
        let input = try CloudImagePreprocessor.resized(image, width: size, height: size)
        let feature = try MLFeatureValue(cgImage: input, pixelsWide: size, pixelsHigh: size,
            pixelFormatType: kCVPixelFormatType_32BGRA, options: nil)
        let prediction = try model.prediction(from: MLDictionaryFeatureProvider(dictionary: ["image": feature]))
        guard let values = prediction.featureValue(for: output)?.multiArrayValue,
              values.shape.map(\.intValue) == [1, 1, size, size] else {
            throw DetectorError.invalidOutput
        }
        let probabilities = (0..<values.count).map { values[$0].floatValue }
        guard probabilities.allSatisfy({ $0.isFinite && $0 >= 0 && $0 <= 1 }) else {
            throw DetectorError.invalidOutput
        }
        return probabilities
    }
}
