import Capacitor
import CoreML
import Foundation
import UIKit
import Vision

@objc(CloudRecognizerPlugin)
public final class CloudRecognizerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CloudRecognizerPlugin"
    public let jsName = "CloudRecognizer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "classify", returnType: CAPPluginReturnPromise)
    ]

    private let classCount = 11
    private let baseWeight = 0.4
    private let candidateWeight = 0.6
    private let minimumConfidence = 0.2
    private let marginThreshold = 0.51
    private let trainingCropFraction = 0.902
    private let modelLock = NSLock()
    private var cachedModels: [String: VNCoreMLModel] = [:]

    @objc public func classify(_ call: CAPPluginCall) {
        let encoded = call.getString("base64")
        let path = call.getString("path")
        guard encoded != nil || path != nil else {
            call.reject("Nie udało się odczytać danych zdjęcia.")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self else { return }
            do {
                let imageData = try self.loadImageData(encoded: encoded, path: path)
                let image = try self.centerCrop(
                    imageData: imageData,
                    fraction: self.trainingCropFraction
                )
                let base = try self.probabilities(
                    image: image,
                    model: self.loadModel(named: "CloudGenusClassifier")
                )
                let candidate = try self.probabilities(
                    image: image,
                    model: self.loadModel(named: "CloudGenusClassifierV3")
                )
                let probabilities = zip(base, candidate).map { baseValue, candidateValue in
                    self.baseWeight * baseValue + self.candidateWeight * candidateValue
                }
#if DEBUG
                print("[CHMURNIK recognizer] ensemble=\(probabilities.count) sum=\(probabilities.reduce(0, +))")
#endif
                call.resolve([
                    "probabilities": probabilities,
                    "minimumConfidence": self.minimumConfidence,
                    "marginThreshold": self.marginThreshold,
                    "modelVersion": "3.0-ensemble"
                ])
            } catch {
                call.reject("Nie udało się przeanalizować zdjęcia.", nil, error)
            }
        }
    }

    private func loadImageData(encoded: String?, path: String?) throws -> Data {
        if let path {
            let url: URL
            if let parsed = URL(string: path), parsed.isFileURL {
                url = parsed
            } else {
                url = URL(fileURLWithPath: path)
            }
            guard let data = try? Data(contentsOf: url), !data.isEmpty else {
                throw RecognitionError.imageUnreadable
            }
            return data
        }
        guard let encoded, let data = Data(base64Encoded: encoded), !data.isEmpty else {
            throw RecognitionError.imageUnreadable
        }
        return data
    }

    private func probabilities(
        image: CGImage,
        model: VNCoreMLModel
    ) throws -> [Double] {
        let request = VNCoreMLRequest(model: model)
        request.imageCropAndScaleOption = .scaleFill
        let handler = VNImageRequestHandler(cgImage: image, options: [:])
        try handler.perform([request])
        guard
            let observation = request.results?.first as? VNCoreMLFeatureValueObservation,
            let values = observation.featureValue.multiArrayValue,
            values.count == classCount
        else {
            throw RecognitionError.invalidOutput
        }
        return (0..<values.count).map { values[$0].doubleValue }
    }

    private func centerCrop(imageData: Data, fraction: Double) throws -> CGImage {
        guard let source = UIImage(data: imageData) else {
            throw RecognitionError.imageUnreadable
        }
        let side = floor(min(source.size.width, source.size.height) * fraction)
        guard side > 0 else {
            throw RecognitionError.imageUnreadable
        }
        let origin = CGPoint(
            x: (source.size.width - side) / 2,
            y: (source.size.height - side) / 2
        )
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(
            size: CGSize(width: side, height: side),
            format: format
        )
        let cropped = renderer.image { _ in
            source.draw(at: CGPoint(x: -origin.x, y: -origin.y))
        }
        guard let image = cropped.cgImage else {
            throw RecognitionError.imageUnreadable
        }
        return image
    }

    private func loadModel(named name: String) throws -> VNCoreMLModel {
        modelLock.lock()
        defer { modelLock.unlock() }
        if let cached = cachedModels[name] {
            return cached
        }
        guard let modelURL = Bundle.main.url(forResource: name, withExtension: "mlmodelc") else {
            throw RecognitionError.modelMissing
        }
        let configuration = MLModelConfiguration()
        configuration.computeUnits = .all
        let model = try MLModel(contentsOf: modelURL, configuration: configuration)
        let visionModel = try VNCoreMLModel(for: model)
        cachedModels[name] = visionModel
        return visionModel
    }
}

private enum RecognitionError: LocalizedError {
    case modelMissing
    case imageUnreadable
    case invalidOutput

    var errorDescription: String? {
        switch self {
        case .modelMissing:
            return "Brakuje modelu rozpoznawania w aplikacji."
        case .imageUnreadable:
            return "Nie udało się odczytać pliku zdjęcia."
        case .invalidOutput:
            return "Model zwrócił niepełny wynik."
        }
    }
}
