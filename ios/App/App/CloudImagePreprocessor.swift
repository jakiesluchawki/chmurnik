import CoreGraphics
import Foundation
import ImageIO

struct CloudInputGeometry: Equatable {
    let resizedWidth: Int
    let resizedHeight: Int
    let crop: CGRect

    var normalizedBounds: CGRect {
        CGRect(x: crop.minX / Double(resizedWidth), y: crop.minY / Double(resizedHeight),
               width: crop.width / Double(resizedWidth), height: crop.height / Double(resizedHeight))
    }

    static func make(width: Int, height: Int, inputSize: Int, fraction: Double = 0.902) throws -> Self {
        guard width > 0, width <= 32768, height > 0, height <= 32768,
              inputSize > 0, inputSize <= 1024,
              fraction.isFinite, fraction >= 0.25, fraction <= 1 else {
            throw CloudImageError.invalidGeometry
        }
        let shortSide = Int((Double(inputSize) / fraction).rounded(.toNearestOrEven))
        let resizedWidth = width <= height ? shortSide : Int(Double(shortSide) * Double(width) / Double(height))
        let resizedHeight = height <= width ? shortSide : Int(Double(shortSide) * Double(height) / Double(width))
        guard resizedWidth >= inputSize, resizedHeight >= inputSize,
              resizedWidth <= 32768, resizedHeight <= 32768 else {
            throw CloudImageError.invalidGeometry
        }
        // Match torchvision Resize(short edge) then CenterCrop, including ties.
        let x = ((Double(resizedWidth) - Double(inputSize)) / 2).rounded(.toNearestOrEven)
        let y = ((Double(resizedHeight) - Double(inputSize)) / 2).rounded(.toNearestOrEven)
        return Self(resizedWidth: resizedWidth, resizedHeight: resizedHeight,
                    crop: CGRect(x: x, y: y, width: Double(inputSize), height: Double(inputSize)))
    }
}

enum CloudImageError: Error {
    case unreadable
    case invalidGeometry
}

enum CloudImagePreprocessor {
    static func orientedImage(data: Data, maximumSide: Int = 1800) throws -> CGImage {
        guard !data.isEmpty, data.count <= 30 * 1024 * 1024,
              maximumSide > 0, maximumSide <= 4096,
              let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: maximumSide,
                kCGImageSourceShouldCacheImmediately: true,
              ] as CFDictionary) else {
            throw CloudImageError.unreadable
        }
        return image
    }

    static func resized(_ image: CGImage, width: Int, height: Int) throws -> CGImage {
        guard width > 0, height > 0, width <= 32768, height <= 32768,
              width * height <= 16_777_216,
              let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
              let context = CGContext(data: nil, width: width, height: height,
                                      bitsPerComponent: 8, bytesPerRow: width * 4,
                                      space: colorSpace,
                                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue) else {
            throw CloudImageError.invalidGeometry
        }
        context.setFillColor(CGColor(gray: 1, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.interpolationQuality = .medium
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let result = context.makeImage() else { throw CloudImageError.unreadable }
        return result
    }

    static func modelInput(_ image: CGImage, size: Int, fraction: Double = 0.902) throws -> (image: CGImage, bounds: CGRect) {
        let geometry = try CloudInputGeometry.make(width: image.width, height: image.height, inputSize: size, fraction: fraction)
        let scaled = try resized(image, width: geometry.resizedWidth, height: geometry.resizedHeight)
        guard let cropped = scaled.cropping(to: geometry.crop) else { throw CloudImageError.unreadable }
        return (cropped, geometry.normalizedBounds)
    }
}
