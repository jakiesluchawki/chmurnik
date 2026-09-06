import Foundation
import ImageIO
import UniformTypeIdentifiers

struct ImageFixture: Decodable {
    let input: String
    let output: String
}

if CommandLine.arguments.count == 2 && CommandLine.arguments[1] == "--invalid-inputs" {
    let fixtures: [(Int, Int, Int, Int, [UInt8])] = [
        (0, 1, 1, 1, []), (-1, 1, 1, 1, []), (32769, 1, 1, 1, []),
        (4097, 4096, 1, 1, []), (1, 4096, 4097, 1, []),
        (1, 1, 4097, 4096, [0, 0, 0]), (1, 1, 1, 1, [0, 0]),
        (1, 1, 0, 1, [0, 0, 0]), (1, 1, 1, -1, [0, 0, 0]),
    ]
    for (w, h, ow, oh, pixels) in fixtures {
        do {
            _ = try ReferenceBilinear.resizeRGB(pixels, width: w, height: h, outputWidth: ow, outputHeight: oh)
            fputs("Invalid dimensions or byte count accepted\n", stderr)
            exit(1)
        } catch CloudImageError.invalidGeometry { }
    }
    print("Rejected all \(fixtures.count) invalid inputs")
    exit(0)
}

if CommandLine.arguments.count == 3 && CommandLine.arguments[1] == "--images" {
    let fixtures = try JSONDecoder().decode([ImageFixture].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
    for fixture in fixtures {
        guard !FileManager.default.fileExists(atPath: fixture.output) else { throw CloudImageError.invalidGeometry }
        let original = try CloudImagePreprocessor.orientedImage(data: Data(contentsOf: URL(fileURLWithPath: fixture.input)))
        let prepared = try ReferenceBilinear.modelInput(original, size: 224, fraction: 0.902)
        guard let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: fixture.output) as CFURL,
                                                               UTType.png.identifier as CFString, 1, nil) else {
            throw CloudImageError.unreadable
        }
        CGImageDestinationAddImage(destination, prepared.image, nil)
        guard CGImageDestinationFinalize(destination) else { throw CloudImageError.unreadable }
    }
    print("Prepared \(fixtures.count) image fixtures")
    exit(0)
}

struct Fixture: Decodable {
    let input: String
    let output: String
    let width: Int
    let height: Int
    let outputWidth: Int
    let outputHeight: Int
}

guard CommandLine.arguments.count == 2 else { throw CloudImageError.invalidGeometry }
let fixtures = try JSONDecoder().decode([Fixture].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
for fixture in fixtures {
    guard !FileManager.default.fileExists(atPath: fixture.output) else { throw CloudImageError.invalidGeometry }
    let rgb = try Data(contentsOf: URL(fileURLWithPath: fixture.input))
    let result = try ReferenceBilinear.resizeRGB(Array(rgb), width: fixture.width, height: fixture.height,
                                               outputWidth: fixture.outputWidth, outputHeight: fixture.outputHeight)
    try Data(result).write(to: URL(fileURLWithPath: fixture.output), options: .withoutOverwriting)
}
print("Resampled \(fixtures.count) fixtures")
