import Foundation
import Vision
import ImageIO

struct Check: Codable { let id, file, expected: String }
struct Result: Codable { let id, file, expected, recognized: String }
let checks = try JSONDecoder().decode([Check].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
var results = [Result]()
for check in checks {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    let supported = try request.supportedRecognitionLanguages()
    request.recognitionLanguages = ["pl-PL", "en-US"].filter { supported.contains($0) }
    let handler = VNImageRequestHandler(url: URL(fileURLWithPath: check.file))
    try handler.perform([request])
    let observations = (request.results ?? []).sorted {
        if abs($0.boundingBox.midY - $1.boundingBox.midY) < 0.008 { return $0.boundingBox.minX < $1.boundingBox.minX }
        return $0.boundingBox.midY > $1.boundingBox.midY
    }
    let recognized = observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
    results.append(Result(id: check.id, file: check.file, expected: check.expected, recognized: recognized))
    print("OCR: \(check.id)")
}
try JSONEncoder().encode(results).write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
