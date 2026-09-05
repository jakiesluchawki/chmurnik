import Capacitor
import CoreML
import Foundation
import ImageIO
import UIKit
import UniformTypeIdentifiers
import Vision

@objc(CloudRecognizerPlugin)
public final class CloudRecognizerPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "CloudRecognizerPlugin"
    public let jsName = "CloudRecognizer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "classify", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "proposeRegions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pickPhoto", returnType: CAPPluginReturnPromise)
    ]

    private let classCount = 11
    private let baseWeight = 0.4
    private let candidateWeight = 0.6
    private let minimumConfidence = 0.2
    private let marginThreshold = 0.51
    private let trainingCropFraction = 0.902
    private let modelLock = NSLock()
    private let inferenceQueue = DispatchQueue(label: "cloud.chmurnik.recognition", qos: .userInitiated, autoreleaseFrequency: .workItem)
    private var regionDetector: CloudRegionDetector?
    private var cachedModels: [String: VNCoreMLModel] = [:]
    private var pendingPhotoCall: CAPPluginCall?

    @objc public func pickPhoto(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self, let controller = self.bridge?.viewController else {
                call.reject("Nie można otworzyć wyboru zdjęcia.")
                return
            }
            guard self.pendingPhotoCall == nil else {
                call.reject("Wybór zdjęcia jest już otwarty.")
                return
            }
            self.pendingPhotoCall = call
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.image], asCopy: true)
            picker.allowsMultipleSelection = false
            picker.delegate = self
            controller.present(picker, animated: true)
        }
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        pendingPhotoCall?.reject("Anulowano wybór zdjęcia.", "photo-cancelled")
        pendingPhotoCall = nil
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let call = pendingPhotoCall else { return }
        pendingPhotoCall = nil
        guard let url = urls.first else {
            call.reject("Nie wybrano zdjęcia.")
            return
        }
        do {
            let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
            guard size > 0, size <= 30 * 1024 * 1024,
                  let source = CGImageSourceCreateWithURL(url as CFURL, nil),
                  let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                    kCGImageSourceCreateThumbnailFromImageAlways: true,
                    kCGImageSourceCreateThumbnailWithTransform: true,
                    kCGImageSourceThumbnailMaxPixelSize: 1800,
                  ] as CFDictionary),
                  let data = UIImage(cgImage: image).jpegData(compressionQuality: 0.86) else {
                call.reject("Wybierz poprawne zdjęcie o rozmiarze do 30 MB.")
                return
            }
            let destination = FileManager.default.temporaryDirectory.appendingPathComponent("chmurnik-photo-\(UUID().uuidString).jpg")
            try data.write(to: destination, options: .atomic)
            call.resolve(["uri": destination.absoluteString])
        } catch {
            call.reject("Nie udało się przygotować zdjęcia.", nil, error)
        }
    }

    @objc public func classify(_ call: CAPPluginCall) {
        let encoded = call.getString("base64")
        let path = call.getString("path")
        let selectedRegion = call.getBool("selectedRegion") == true
        guard encoded != nil || path != nil else {
            call.reject("Nie udało się odczytać danych zdjęcia.")
            return
        }

        inferenceQueue.async { [weak self] in
            guard let self else { call.reject("Analiza została zamknięta."); return }
            do {
                let imageData = try self.loadImageData(encoded: encoded, path: path)
                let image = try selectedRegion
                    ? CloudImagePreprocessor.selectedRegion(data: imageData)
                    : self.centerCrop(imageData: imageData, fraction: self.trainingCropFraction)
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
                    // Selected crops have not passed their own confidence calibration.
                    "minimumConfidence": selectedRegion ? 1.01 : self.minimumConfidence,
                    "marginThreshold": self.marginThreshold,
                    "modelVersion": selectedRegion ? "3.0-ensemble-selected-region-experimental" : "3.0-ensemble"
                ])
            } catch {
                call.reject("Nie udało się przeanalizować zdjęcia.", nil, error)
            }
        }
    }

    @objc public func proposeRegions(_ call: CAPPluginCall) {
        let encoded = call.getString("base64")
        let path = call.getString("path")
        inferenceQueue.async { [weak self] in
            guard let self else { call.reject("Analiza została zamknięta."); return }
            do {
                let data = try self.loadImageData(encoded: encoded, path: path)
                if self.regionDetector == nil { self.regionDetector = try CloudRegionDetector() }
                guard let detector = self.regionDetector else { throw RecognitionError.modelMissing }
                let regions = try detector.detect(imageData: data)
                call.resolve([
                    "regions": regions.enumerated().map { index, region in
                        let anchor = region.anchor ?? CGPoint(x: region.bounds.midX, y: region.bounds.midY)
                        return ["id": "cloud-area-\(index + 1)", "anchor": ["x": anchor.x, "y": anchor.y], "bounds": [
                            "x": region.bounds.minX, "y": region.bounds.minY,
                            "width": region.bounds.width, "height": region.bounds.height
                        ]] as [String: Any]
                    },
                    "modelVersion": "4.0-cloud-areas-experimental"
                ])
            } catch {
                call.reject("Nie udało się wyznaczyć obszarów. Wskaż miejsce na zdjęciu.", "regions-unavailable", error)
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
            guard let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize,
                  size > 0, size <= 30 * 1024 * 1024,
                  let data = try? Data(contentsOf: url), !data.isEmpty, data.count <= 30 * 1024 * 1024 else {
                throw RecognitionError.imageUnreadable
            }
            return data
        }
        guard let encoded, encoded.utf8.count <= 40 * 1024 * 1024,
              let data = Data(base64Encoded: encoded), !data.isEmpty, data.count <= 30 * 1024 * 1024 else {
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
