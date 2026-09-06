import CoreGraphics
import Foundation

// Research-only adaptation of Pillow 12.2.0's RGB bilinear resampler.
// See Pillow-LICENSE.txt and the native-resampling-probe task note.
enum ReferenceBilinear {
    private struct Tap {
        let start: Int
        let weights: [Int]
    }

    private static func taps(source: Int, destination: Int) -> [Tap] {
        let scale = Double(source) / Double(destination)
        let support = max(1, scale)
        return (0..<destination).map { position in
            let center = (Double(position) + 0.5) * scale
            let start = max(0, Int(center - support + 0.5))
            let end = min(source, Int(center + support + 0.5))
            let weights = (start..<end).map { index in
                max(0, 1 - abs((Double(index) - center + 0.5) * (1 / support)))
            }
            let total = weights.reduce(0, +)
            return Tap(start: start, weights: weights.map { Int(0.5 + ($0 / total) * Double(1 << 22)) })
        }
    }

    static func resizeRGB(_ pixels: [UInt8], width: Int, height: Int,
                          outputWidth: Int, outputHeight: Int) throws -> [UInt8] {
        guard [width, height, outputWidth, outputHeight].allSatisfy({ $0 > 0 && $0 <= 32768 }),
              width * height <= 16_777_216, outputWidth * height <= 16_777_216,
              outputWidth * outputHeight <= 16_777_216,
              pixels.count == width * height * 3 else { throw CloudImageError.invalidGeometry }
        var horizontal = pixels
        if width != outputWidth {
            let horizontalTaps = taps(source: width, destination: outputWidth)
            horizontal = [UInt8](repeating: 0, count: outputWidth * height * 3)
            for y in 0..<height {
                for x in 0..<outputWidth {
                    let tap = horizontalTaps[x]
                    for channel in 0..<3 {
                        var accumulator = 1 << 21
                        for (offset, coefficient) in tap.weights.enumerated() {
                            accumulator += Int(pixels[(y * width + tap.start + offset) * 3 + channel]) * coefficient
                        }
                        horizontal[(y * outputWidth + x) * 3 + channel] = UInt8(clamping: accumulator >> 22)
                    }
                }
            }
        }
        guard height != outputHeight else { return horizontal }
        let verticalTaps = taps(source: height, destination: outputHeight)
        var output = [UInt8](repeating: 0, count: outputWidth * outputHeight * 3)
        for y in 0..<outputHeight {
            let tap = verticalTaps[y]
            for x in 0..<outputWidth {
                for channel in 0..<3 {
                    var accumulator = 1 << 21
                    for (offset, coefficient) in tap.weights.enumerated() {
                        accumulator += Int(horizontal[((tap.start + offset) * outputWidth + x) * 3 + channel]) * coefficient
                    }
                    output[(y * outputWidth + x) * 3 + channel] = UInt8(clamping: accumulator >> 22)
                }
            }
        }
        return output
    }

    static func modelInput(_ image: CGImage, size: Int, fraction: Double) throws -> (image: CGImage, bounds: CGRect) {
        let geometry = try CloudInputGeometry.make(width: image.width, height: image.height, inputSize: size, fraction: fraction)
        guard image.width * image.height <= 16_777_216,
              let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else { throw CloudImageError.invalidGeometry }
        var rgba = [UInt8](repeating: 0, count: image.width * image.height * 4)
        try rgba.withUnsafeMutableBytes { buffer in
            guard let context = CGContext(data: buffer.baseAddress, width: image.width, height: image.height,
                                          bitsPerComponent: 8, bytesPerRow: image.width * 4, space: colorSpace,
                                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue)
            else { throw CloudImageError.unreadable }
            context.setFillColor(CGColor(gray: 1, alpha: 1))
            context.fill(CGRect(x: 0, y: 0, width: image.width, height: image.height))
            context.interpolationQuality = .none
            context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        }
        var rgb = [UInt8]()
        rgb.reserveCapacity(image.width * image.height * 3)
        for offset in stride(from: 0, to: rgba.count, by: 4) { rgb.append(contentsOf: rgba[offset..<(offset + 3)]) }
        let resized = try resizeRGB(rgb, width: image.width, height: image.height,
                                    outputWidth: geometry.resizedWidth, outputHeight: geometry.resizedHeight)
        guard let provider = CGDataProvider(data: Data(resized) as CFData),
              let scaled = CGImage(width: geometry.resizedWidth, height: geometry.resizedHeight,
                                   bitsPerComponent: 8, bitsPerPixel: 24, bytesPerRow: geometry.resizedWidth * 3,
                                   space: colorSpace, bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
                                   provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent),
              let cropped = scaled.cropping(to: geometry.crop) else { throw CloudImageError.unreadable }
        return (cropped, geometry.normalizedBounds)
    }
}
