import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

func expect(_ value: @autoclosure () -> Bool, _ message: String) {
    guard value() else { fatalError(message) }
}

let landscape = try CloudInputGeometry.make(width: 1600, height: 900, inputSize: 224)
expect(landscape.resizedWidth == 440 && landscape.resizedHeight == 248, "Resize must match torchvision integer geometry")
expect(landscape.crop == CGRect(x: 108, y: 12, width: 224, height: 224), "Incorrect landscape center crop")
let portrait = try CloudInputGeometry.make(width: 900, height: 1600, inputSize: 224)
expect(portrait.crop == CGRect(x: 12, y: 108, width: 224, height: 224), "Incorrect portrait center crop")
let tie = try CloudInputGeometry.make(width: 465, height: 248, inputSize: 224)
expect(tie.crop.minX == 120, "Half-pixel centers must use ties-to-even rounding")
expect(landscape.normalizedBounds.maxX <= 1 && landscape.normalizedBounds.maxY <= 1, "Bounds must remain inside the original")
do {
    _ = try CloudInputGeometry.make(width: 0, height: 2, inputSize: 224)
    fatalError("Invalid dimensions accepted")
} catch CloudImageError.invalidGeometry {}

let pixels: [UInt8] = [
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255, 0, 0, 0, 255,
]
let provider = CGDataProvider(data: Data(pixels) as CFData)!
let image = CGImage(width: 4, height: 2, bitsPerComponent: 8, bitsPerPixel: 32,
                    bytesPerRow: 16, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
                    provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)!
let same = try CloudImagePreprocessor.resized(image, width: 4, height: 2)
let sameBytes = same.dataProvider!.data! as Data
expect(Array(sameBytes.prefix(16)) == Array(pixels.prefix(16)), "Rendering changed image orientation or channel order")
let cropped = same.cropping(to: CGRect(x: 0, y: 0, width: 2, height: 1))!
let croppedBytes = cropped.dataProvider!.data! as Data
expect(Array(croppedBytes.prefix(8)) == Array(pixels.prefix(8)), "Crop coordinates must be top-left based")

let encoded = NSMutableData()
let destination = CGImageDestinationCreateWithData(encoded, UTType.tiff.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, image, [kCGImagePropertyOrientation: 6] as CFDictionary)
expect(CGImageDestinationFinalize(destination), "Could not create orientation fixture")
let oriented = try CloudImagePreprocessor.orientedImage(data: encoded as Data)
expect(oriented.width == 2 && oriented.height == 4, "EXIF orientation was not applied")
let prepared = try CloudImagePreprocessor.modelInput(oriented, size: 224)
expect(prepared.image.width == 224 && prepared.image.height == 224, "Model input dimensions must be exact")
print("Native recognition image geometry, channel order and EXIF tests passed")
