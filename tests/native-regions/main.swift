import CoreGraphics
import Foundation

func require(_ condition: @autoclosure () -> Bool, _ message: String) {
    if !condition() { fatalError(message) }
}

if CommandLine.arguments.count == 3 {
    let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
    let input = try JSONSerialization.jsonObject(with: data) as! [String: Any]
    let bounds = input["content"] as! [Double]
    let proposals = try CloudRegionProposer.propose(features: (input["features"] as! [NSNumber]).map(\.floatValue),
        columns: input["columns"] as! Int, rows: input["rows"] as! Int, channels: input["channels"] as! Int,
        content: CGRect(x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3]),
        skyScores: (input["skyScores"] as? [NSNumber])?.map(\.floatValue))
    let output = proposals.map { ["bounds": [Double($0.bounds.minX), Double($0.bounds.minY), Double($0.bounds.width), Double($0.bounds.height)], "patchCount": $0.patchCount] as [String: Any] }
    try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
} else {
    let full = CGRect(x: 0, y: 0, width: 1, height: 1)
    let uniform: [Float] = Array(repeating: [Float(1), Float(0), Float(0)], count: 256).flatMap { $0 }
    let uniformRegions = try CloudRegionProposer.propose(features: uniform, columns: 16, rows: 16, channels: 3, content: full)
    require(uniformRegions.isEmpty,
            "Uniform features must not fabricate separate objects")
    var features = uniform
    for y in 3..<6 { for x in 2..<5 { for c in 0..<3 { features[(y * 16 + x) * 3 + c] = c == 1 ? 1 : 0 } } }
    for y in 9..<12 { for x in 10..<13 { for c in 0..<3 { features[(y * 16 + x) * 3 + c] = c == 2 ? 1 : 0 } } }
    let regions = try CloudRegionProposer.propose(features: features, columns: 16, rows: 16, channels: 3, content: full)
    require(regions.count == 2, "Two separate visual components should produce two proposals")
    require(regions.allSatisfy { full.contains($0.bounds) }, "Regions must stay inside the photograph")
    var skyScores = Array(repeating: Float(1), count: 256)
    for y in 8..<16 { for x in 0..<16 { skyScores[y * 16 + x] = 0 } }
    let skyOnly = try CloudRegionProposer.propose(features: features, columns: 16, rows: 16,
        channels: 3, content: full, skyScores: skyScores)
    require(!skyOnly.isEmpty && skyOnly.allSatisfy { $0.bounds.maxY <= 0.5 }, "Foreground components must not become cloud proposals")
    let noSky = try CloudRegionProposer.propose(features: features, columns: 16, rows: 16,
        channels: 3, content: full, skyScores: Array(repeating: 0, count: 256))
    require(noSky.isEmpty, "No sky must produce no proposals")
    let padded = CGRect(x: 0, y: 0.125, width: 1, height: 0.75)
    let mapped = try CloudRegionProposer.propose(features: features, columns: 16, rows: 16, channels: 3, content: padded)
    require(mapped.allSatisfy { full.contains($0.bounds) }, "Letterbox coordinates must map back to the original image")
    do {
        _ = try CloudRegionProposer.propose(features: [.nan], columns: 1, rows: 1, channels: 1, content: full)
        fatalError("Invalid model features were accepted")
    } catch CloudRegionProposer.ProposalError.invalidFeatures { }
    print("Native visual-region tests passed")
}
