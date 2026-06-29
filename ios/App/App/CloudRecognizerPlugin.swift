import Capacitor
import CoreML
import UIKit
import Vision

private enum CloudRecognitionError: LocalizedError {
    case invalidImage
    case missingModel
    case missingOutput

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Nie udało się odczytać zdjęcia."
        case .missingModel:
            return "Model rozpoznawania nie jest dostępny w tej wersji aplikacji."
        case .missingOutput:
            return "Model nie zwrócił kompletnego wyniku."
        }
    }
}

private final class CloudRecognizerEngine {
    static let shared = Result { try CloudRecognizerEngine() }

    private let classes = [
        "cirrus", "cirrocumulus", "cirrostratus", "altocumulus",
        "altostratus", "nimbostratus", "stratocumulus", "stratus",
        "cumulus", "cumulonimbus", "clear_sky"
    ]
    private let model: MLModel
    private let visionModel: VNCoreMLModel
    private let marginThreshold: Double
    private let minimumConfidence: Double

    private init() throws {
        guard let modelURL = Bundle.main.url(
            forResource: "CloudGenusClassifier",
            withExtension: "mlmodelc"
        ) else {
            throw CloudRecognitionError.missingModel
        }
        let configuration = MLModelConfiguration()
        configuration.computeUnits = .all
        model = try MLModel(contentsOf: modelURL, configuration: configuration)
        visionModel = try VNCoreMLModel(for: model)
        let metadata = model.modelDescription.metadata[.creatorDefinedKey]
            as? [String: String]
        marginThreshold = Double(
            metadata?["abstention_margin_threshold"] ?? "0.30"
        ) ?? 0.30
        minimumConfidence = Double(
            metadata?["minimum_confidence"] ?? "0.0"
        ) ?? 0.0
    }

    func classify(_ image: UIImage) throws -> [String: Any] {
        guard let cgImage = image.normalizedCGImage else {
            throw CloudRecognitionError.invalidImage
        }
        let request = VNCoreMLRequest(model: visionModel)
        request.imageCropAndScaleOption = .centerCrop
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try handler.perform([request])
        guard
            let observation = request.results?.compactMap({
                $0 as? VNCoreMLFeatureValueObservation
            }).first,
            let output = observation.featureValue.multiArrayValue,
            output.count == classes.count
        else {
            throw CloudRecognitionError.missingOutput
        }
        let probabilities = (0..<output.count).map { output[$0].doubleValue }
        return [
            "classes": classes,
            "probabilities": probabilities,
            "marginThreshold": marginThreshold,
            "minimumConfidence": minimumConfidence,
            "modelVersion": "2.0"
        ]
    }
}

private extension UIImage {
    var normalizedCGImage: CGImage? {
        if imageOrientation == .up, let cgImage {
            return cgImage
        }
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let renderer = UIGraphicsImageRenderer(size: size, format: format)
        return renderer.image { _ in
            draw(in: CGRect(origin: .zero, size: size))
        }.cgImage
    }
}

@objc(CloudRecognizerPlugin)
final class CloudRecognizerPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "CloudRecognizerPlugin"
    let jsName = "CloudRecognizer"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "classify", returnType: CAPPluginReturnPromise)
    ]

    @objc func classify(_ call: CAPPluginCall) {
        guard
            let dataURL = call.getString("dataUrl"),
            let comma = dataURL.firstIndex(of: ","),
            let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])),
            let image = UIImage(data: data)
        else {
            call.reject(CloudRecognitionError.invalidImage.localizedDescription)
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let engine = try CloudRecognizerEngine.shared.get()
                let result = try engine.classify(image)
                DispatchQueue.main.async { call.resolve(result) }
            } catch {
                DispatchQueue.main.async { call.reject(error.localizedDescription) }
            }
        }
    }
}
