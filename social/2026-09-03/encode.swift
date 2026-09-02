import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct Area: Decodable { let x, y, width, height: Double }
struct Frame: Decodable { let file: String; let holdFrames: Int }
struct Job: Decodable {
    let output, background, preview: String
    let area: Area
    let frames: [Frame]
    let fps: Int32
}
struct Jobs: Decodable { let jobs: [Job] }
enum RenderError: Error { case failed(String) }

func require(_ condition: Bool, _ message: String) throws {
    if !condition { throw RenderError.failed(message) }
}
func image(_ file: String) throws -> CGImage {
    guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: file) as CFURL, nil),
          let result = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw RenderError.failed("Cannot decode image: \(file)")
    }
    return result
}

let plan = try JSONDecoder().decode(Jobs.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
for job in plan.jobs {
    let finalURL = URL(fileURLWithPath: job.output)
    let temporaryURL = URL(fileURLWithPath: job.preview).deletingLastPathComponent().appendingPathComponent(UUID().uuidString + ".mp4")
    defer { try? FileManager.default.removeItem(at: temporaryURL) }
    let writer = try AVAssetWriter(outputURL: temporaryURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: 1080, AVVideoHeightKey: 1920,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 8_000_000,
            AVVideoExpectedSourceFrameRateKey: job.fps,
            AVVideoMaxKeyFrameIntervalKey: job.fps,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        ],
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: 1080, kCVPixelBufferHeightKey as String: 1920,
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ])
    try require(writer.canAdd(input), "Unsupported H.264 writer input")
    writer.add(input)
    try require(writer.startWriting(), "Could not start video writer: \(String(describing: writer.error))")
    writer.startSession(atSourceTime: .zero)
    let background = try image(job.background)
    try require(background.width == 1080 && background.height == 1920, "Wrong background dimensions")
    let area = CGRect(x: job.area.x, y: 1920 - job.area.y - job.area.height, width: job.area.width, height: job.area.height)
    var index: Int64 = 0
    for frame in job.frames {
        guard let pool = adaptor.pixelBufferPool else { throw RenderError.failed("Missing pixel buffer pool") }
        var allocated: CVPixelBuffer?
        try require(CVPixelBufferPoolCreatePixelBuffer(nil, pool, &allocated) == kCVReturnSuccess, "Pixel buffer allocation failed")
        guard let buffer = allocated else { throw RenderError.failed("Missing pixel buffer") }
        CVPixelBufferLockBaseAddress(buffer, [])
        guard let context = CGContext(data: CVPixelBufferGetBaseAddress(buffer), width: 1080, height: 1920,
            bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue) else {
            throw RenderError.failed("Cannot create drawing context")
        }
        context.interpolationQuality = .high
        context.draw(background, in: CGRect(x: 0, y: 0, width: 1080, height: 1920))
        context.saveGState()
        context.addPath(CGPath(roundedRect: area, cornerWidth: 24, cornerHeight: 24, transform: nil))
        context.clip()
        context.setFillColor(CGColor(red: 1, green: 247.0 / 255, blue: 241.0 / 255, alpha: 1))
        context.fill(area)
        let demo = try image(frame.file)
        let scale = min(area.width / CGFloat(demo.width), area.height / CGFloat(demo.height))
        let size = CGSize(width: CGFloat(demo.width) * scale, height: CGFloat(demo.height) * scale)
        context.draw(demo, in: CGRect(x: area.midX - size.width / 2, y: area.midY - size.height / 2, width: size.width, height: size.height))
        context.restoreGState()
        CVPixelBufferUnlockBaseAddress(buffer, [])
        for _ in 0..<frame.holdFrames {
            let deadline = Date().addingTimeInterval(30)
            while !input.isReadyForMoreMediaData {
                try require(writer.status == .writing && Date() < deadline, "Video encoder stalled: \(String(describing: writer.error))")
                try await Task.sleep(nanoseconds: 5_000_000)
            }
            try require(adaptor.append(buffer, withPresentationTime: CMTime(value: index, timescale: job.fps)), "Frame append failed")
            index += 1
        }
    }
    writer.endSession(atSourceTime: CMTime(value: index, timescale: job.fps))
    input.markAsFinished()
    await writer.finishWriting()
    try require(writer.status == .completed, "Encoding failed: \(String(describing: writer.error))")
    let asset = AVURLAsset(url: temporaryURL)
    let tracks = try await asset.loadTracks(withMediaType: .video)
    let audio = try await asset.loadTracks(withMediaType: .audio)
    try require(tracks.count == 1 && audio.isEmpty, "Expected one silent video track")
    let size = try await tracks[0].load(.naturalSize)
    let duration = try await asset.load(.duration).seconds
    try require(size == CGSize(width: 1080, height: 1920), "Wrong video dimensions")
    try require(abs(duration - Double(index) / Double(job.fps)) < 0.08, "Wrong video duration")
    let generator = AVAssetImageGenerator(asset: asset)
    let preview = try generator.copyCGImage(at: CMTime(seconds: min(5, duration / 2), preferredTimescale: 600), actualTime: nil)
    guard let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: job.preview) as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        throw RenderError.failed("Cannot create QA preview")
    }
    CGImageDestinationAddImage(destination, preview, nil)
    try require(CGImageDestinationFinalize(destination), "Cannot save decoded QA preview")
    if FileManager.default.fileExists(atPath: finalURL.path) { try FileManager.default.removeItem(at: finalURL) }
    try FileManager.default.moveItem(at: temporaryURL, to: finalURL)
    print("Verified H.264 MP4: \(finalURL.lastPathComponent), 1080x1920, \(job.fps)fps, \(duration)s, no audio")
}
