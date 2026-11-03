import CoreML
import Foundation
import Vision

// Run by check-photo-model.mjs on a Mac using the four models in the tested .app.
let args = CommandLine.arguments
guard args.count == 3, let bundle = Bundle(path: args[1]) else { exit(2) }
let paths = try JSONDecoder().decode([String].self, from: FileHandle.standardInput.readDataToEndOfFile())
var rows: [[String: Any]] = []
if args[2] == "proposals" {
    let detector = try CloudRegionDetector(bundle: bundle)
    for path in paths {
        rows.append(try autoreleasepool {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            let image = try CloudImagePreprocessor.orientedImage(data: data)
            let regions = try detector.detect(imageData: data).map { r in
                let anchor = r.anchor ?? CGPoint(x: r.bounds.midX, y: r.bounds.midY)
                return ["bounds": ["x": r.bounds.minX, "y": r.bounds.minY,
                                   "width": r.bounds.width, "height": r.bounds.height],
                        "anchor": ["x": anchor.x, "y": anchor.y]]
            }
            return ["width": image.width, "height": image.height, "regions": regions]
        })
    }
} else if args[2] == "classify" {
    let models = try ["CloudGenusClassifier", "CloudGenusClassifierV3"].map { name in
        guard let url = bundle.url(forResource: name, withExtension: "mlmodelc") else { throw CocoaError(.fileNoSuchFile) }
        return try VNCoreMLModel(for: MLModel(contentsOf: url))
    }
    for path in paths {
        rows.append(try autoreleasepool {
            let image = try CloudImagePreprocessor.selectedRegion(data: Data(contentsOf: URL(fileURLWithPath: path)))
            let scores = try models.map { model in
                let req = VNCoreMLRequest(model: model)
                req.imageCropAndScaleOption = .scaleFill
                try VNImageRequestHandler(cgImage: image).perform([req])
                guard let vector = (req.results?.first as? VNCoreMLFeatureValueObservation)?.featureValue.multiArrayValue,
                      vector.count == 11 else { throw CocoaError(.coderInvalidValue) }
                return (0..<11).map { vector[$0].doubleValue }
            }
            return ["probabilities": zip(scores[0], scores[1]).map { 0.4 * $0 + 0.6 * $1 }]
        })
    }
} else { exit(2) }
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: rows))
