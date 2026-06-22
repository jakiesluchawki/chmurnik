import Capacitor
import CoreML
import Foundation
import Vision

@objc(CloudRecognizerPlugin)
public final class CloudRecognizerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CloudRecognizerPlugin"
    public let jsName = "CloudRecognizer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "classify", returnType: CAPPluginReturnPromise)
    ]

    private let classCount = 11

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
                let model = try self.loadModel()
                let metadata = model.modelDescription.metadata[.creatorDefinedKey] as? [String: String] ?? [:]
                let visionModel = try VNCoreMLModel(for: model)
                let request = VNCoreMLRequest(model: visionModel)
                request.imageCropAndScaleOption = .centerCrop
                let handler = VNImageRequestHandler(data: imageData, options: [:])
                try handler.perform([request])

                guard
                    let observation = request.results?.first as? VNCoreMLFeatureValueObservation,
                    let values = observation.featureValue.multiArrayValue,
                    values.count == self.classCount
                else {
                    throw RecognitionError.invalidOutput
                }

                let probabilities = (0..<values.count).map { values[$0].doubleValue }
                call.resolve([
                    "probabilities": probabilities,
                    "minimumConfidence": Double(metadata["minimum_confidence"] ?? "") ?? 0.2,
                    "marginThreshold": Double(metadata["abstention_margin_threshold"] ?? "") ?? 0.68,
                    "modelVersion": "2.0"
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

    private func loadModel() throws -> MLModel {
        guard let modelURL = Bundle.main.url(forResource: "CloudGenusClassifier", withExtension: "mlmodelc") else {
            throw RecognitionError.modelMissing
        }
        let configuration = MLModelConfiguration()
        configuration.computeUnits = .all
        return try MLModel(contentsOf: modelURL, configuration: configuration)
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
