import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct Rect: Decodable { let x, y, width, height: Double }
struct Palette: Decodable { let background, ink, accent, wash: String }
struct PromoFrame: Decodable {
    let file: String
    let sourceArea: Rect?
    let shot, overlay: Int
    let progress, focus, zoom: Double
}
struct PromoJob: Decodable {
    let id, output, previews: String
    let fps: Int32
    let frames: [PromoFrame]
    let overlays: [String]
    let palette: Palette
    let stage: Rect
}
struct PromoJobs: Decodable { let jobs: [PromoJob] }
enum PromoError: Error { case failed(String) }
func require(_ condition: Bool, _ message: String) throws {
    if !condition { throw PromoError.failed(message) }
}
func image(_ file: String) throws -> CGImage {
    guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: file) as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { throw PromoError.failed("Image: \(file)") }
    return image
}
func color(_ hex: String, alpha: CGFloat = 1) -> CGColor {
    let value = UInt32(hex.dropFirst(), radix: 16)!
    return CGColor(colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!, components: [
        CGFloat((value >> 16) & 255) / 255, CGFloat((value >> 8) & 255) / 255,
        CGFloat(value & 255) / 255, alpha,
    ])!
}
func save(_ image: CGImage, to path: String) throws {
    guard let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)
    else { throw PromoError.failed("Preview output") }
    CGImageDestinationAddImage(destination, image, nil)
    try require(CGImageDestinationFinalize(destination), "PNG preview")
}
let plan = try JSONDecoder().decode(PromoJobs.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
for job in plan.jobs {
    let finalURL = URL(fileURLWithPath: job.output)
    let temporaryURL = URL(fileURLWithPath: job.previews + "-render.mp4")
    if FileManager.default.fileExists(atPath: temporaryURL.path) { try FileManager.default.removeItem(at: temporaryURL) }
    defer { try? FileManager.default.removeItem(at: temporaryURL) }
    let writer = try AVAssetWriter(outputURL: temporaryURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: 1080, AVVideoHeightKey: 1920,
        AVVideoColorPropertiesKey: [AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
            AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2, AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2],
        AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 8_000_000, AVVideoExpectedSourceFrameRateKey: job.fps,
            AVVideoMaxKeyFrameIntervalKey: job.fps, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: 1080, kCVPixelBufferHeightKey as String: 1920,
        kCVPixelBufferCGImageCompatibilityKey as String: true, kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ])
    try require(writer.canAdd(input), "Video input")
    writer.add(input)
    try require(writer.startWriting(), "Start writer")
    writer.startSession(atSourceTime: .zero)
    let overlays = try job.overlays.map(image)
    var cache = [String: CGImage]()
    let stage = CGRect(x: job.stage.x, y: 1920 - job.stage.y - job.stage.height, width: job.stage.width, height: job.stage.height)
    for (index, frame) in job.frames.enumerated() {
        try autoreleasepool {
            let full: CGImage
            if let cached = cache[frame.file] { full = cached }
            else {
                full = try image(frame.file)
                if cache.count > 16 { cache.removeAll(keepingCapacity: true) }
                cache[frame.file] = full
            }
            let source: CGImage
            if let crop = frame.sourceArea {
                guard let cropped = full.cropping(to: CGRect(x: crop.x, y: crop.y, width: crop.width, height: crop.height)) else { throw PromoError.failed("Capture crop") }
                source = cropped
            } else { source = full }
            guard let pool = adaptor.pixelBufferPool else { throw PromoError.failed("Pixel buffer pool") }
            var allocated: CVPixelBuffer?
            try require(CVPixelBufferPoolCreatePixelBuffer(nil, pool, &allocated) == kCVReturnSuccess, "Pixel allocation")
            guard let buffer = allocated else { throw PromoError.failed("Pixel buffer") }
            CVBufferSetAttachment(buffer, kCVImageBufferCGColorSpaceKey, CGColorSpace(name: CGColorSpace.sRGB)!, .shouldPropagate)
            CVBufferSetAttachment(buffer, kCVImageBufferColorPrimariesKey, kCVImageBufferColorPrimaries_ITU_R_709_2, .shouldPropagate)
            CVBufferSetAttachment(buffer, kCVImageBufferTransferFunctionKey, kCVImageBufferTransferFunction_sRGB, .shouldPropagate)
            CVPixelBufferLockBaseAddress(buffer, [])
            guard let context = CGContext(data: CVPixelBufferGetBaseAddress(buffer), width: 1080, height: 1920,
                bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
                space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)
            else { throw PromoError.failed("Drawing context") }
            context.interpolationQuality = .high
            context.setFillColor(color(job.palette.background))
            context.fill(CGRect(x: 0, y: 0, width: 1080, height: 1920))
            let p = CGFloat(frame.progress)
            let settle = 1 - pow(1 - min(1, p * 6), 3)
            let direction: CGFloat = frame.shot % 2 == 0 ? 1 : -1
            let card = stage.insetBy(dx: 10, dy: 9)
            context.saveGState()
            context.translateBy(x: stage.midX, y: stage.midY)
            context.rotate(by: direction * (1 - settle) * 0.022)
            context.translateBy(x: -stage.midX + direction * 35 * (1 - settle), y: -stage.midY - 16 * (1 - settle))
            context.setShadow(offset: CGSize(width: 0, height: -12), blur: 25, color: color(job.palette.ink, alpha: 0.16))
            context.setFillColor(color(job.palette.wash))
            context.addPath(CGPath(roundedRect: card, cornerWidth: 32, cornerHeight: 32, transform: nil)); context.fillPath()
            context.setShadow(offset: .zero, blur: 0, color: nil)
            context.addPath(CGPath(roundedRect: card, cornerWidth: 32, cornerHeight: 32, transform: nil)); context.clip()
            // Reframe recorded pixels without replacing UI values or photographs.
            let base = max(card.width / CGFloat(source.width), card.height / CGFloat(source.height))
            let punch = frame.shot % 2 == 0 ? 1 + (CGFloat(frame.zoom) - 1) * settle : CGFloat(frame.zoom) - (CGFloat(frame.zoom) - 1) * p
            let scale = base * punch
            let width = CGFloat(source.width) * scale
            let height = CGFloat(source.height) * scale
            let target = CGRect(x: card.midX - width / 2 + direction * sin(p * .pi) * 7,
                y: card.minY - (height - card.height) * (1 - CGFloat(frame.focus)), width: width, height: height)
            context.draw(source, in: target)
            context.restoreGState()
            context.draw(overlays[frame.overlay], in: CGRect(x: 0, y: 0, width: 1080, height: 1920))
            let progressY = stage.minY - 10
            context.setFillColor(color(job.palette.ink, alpha: 0.14))
            context.fill(CGRect(x: 80, y: progressY, width: 920, height: 4))
            context.setFillColor(color(job.palette.accent))
            context.fill(CGRect(x: 80, y: progressY, width: 920 * CGFloat(index + 1) / CGFloat(job.frames.count), height: 4))
            CVPixelBufferUnlockBaseAddress(buffer, [])
            let deadline = Date().addingTimeInterval(30)
            while !input.isReadyForMoreMediaData {
                try require(writer.status == .writing && Date() < deadline, "Encoder stalled")
                Thread.sleep(forTimeInterval: 0.002)
            }
            try require(adaptor.append(buffer, withPresentationTime: CMTime(value: Int64(index), timescale: job.fps)), "Append frame")
        }
    }
    writer.endSession(atSourceTime: CMTime(value: Int64(job.frames.count), timescale: job.fps))
    input.markAsFinished()
    await writer.finishWriting()
    try require(writer.status == .completed, "Encoding: \(String(describing: writer.error))")
    let asset = AVURLAsset(url: temporaryURL)
    let tracks = try await asset.loadTracks(withMediaType: .video)
    let audio = try await asset.loadTracks(withMediaType: .audio)
    let duration = try await asset.load(.duration).seconds
    try require(tracks.count == 1 && audio.isEmpty, "Expected one silent video track")
    let size = try await tracks[0].load(.naturalSize)
    try require(size == CGSize(width: 1080, height: 1920), "Video dimensions")
    try require(abs(duration - Double(job.frames.count) / Double(job.fps)) < 0.05, "Video duration")
    let generator = AVAssetImageGenerator(asset: asset)
    generator.requestedTimeToleranceBefore = .zero
    generator.requestedTimeToleranceAfter = .zero
    for shot in Set(job.frames.map(\.shot)).sorted() {
        let indexes = job.frames.indices.filter { job.frames[$0].shot == shot }
        let index = indexes[indexes.count / 2]
        let preview = try generator.copyCGImage(at: CMTime(value: Int64(index), timescale: job.fps), actualTime: nil)
        try save(preview, to: job.previews + "-shot-\(shot).png")
    }
    if FileManager.default.fileExists(atPath: finalURL.path) { try FileManager.default.removeItem(at: finalURL) }
    try FileManager.default.moveItem(at: temporaryURL, to: finalURL)
    print("PROMO verified: \(job.id), \(duration)s, \(Set(job.frames.map(\.shot)).count) cuts, full copy on every frame, silent H.264")
}
