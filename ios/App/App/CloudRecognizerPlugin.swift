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
        guard let encoded = call.getString("base64"), let imageData = Data(base64Encoded: encoded) else {
            call.reject("Nie udało się odczytać danych zdjęcia.")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self else { return }
            do {
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
    case invalidOutput

    var errorDescription: String? {
        switch self {
        case .modelMissing:
            return "Brakuje modelu rozpoznawania w aplikacji."
        case .invalidOutput:
            return "Model zwrócił niepełny wynik."
        }
    }
}
