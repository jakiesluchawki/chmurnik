import CoreGraphics
import Foundation

struct CloudRegionProposal {
    let bounds: CGRect
    let patchCount: Int
    let anchor: CGPoint?

    init(bounds: CGRect, patchCount: Int, anchor: CGPoint? = nil) {
        self.bounds = bounds
        self.patchCount = patchCount
        self.anchor = anchor
    }
}

/// Selectable regions, not cloud labels or individual-cloud identities.
/// A classifier must assess each region before presenting a cloud hypothesis.
enum CloudRegionProposer {
    /// Connected cloud-mask areas are selectable proposals, not individual-cloud identities.
    static func propose(cloudScores: [Float], skyScores: [Float], columns: Int, rows: Int,
                        limit: Int = 5) throws -> [CloudRegionProposal] {
        guard columns > 0, rows > 0, columns <= 512, rows <= 512,
              cloudScores.count == columns * rows, skyScores.count == cloudScores.count,
              cloudScores.allSatisfy({ $0.isFinite && $0 >= 0 && $0 <= 1 }),
              skyScores.allSatisfy({ $0.isFinite && $0 >= 0 && $0 <= 1 }),
              limit > 0, limit <= 8 else { throw ProposalError.invalidFeatures }
        let eligible = skyScores.map { $0 >= 0.7 }
        let skyCount = eligible.filter { $0 }.count
        guard skyCount >= 32 else { return [] }
        let minimumArea = max(16, Int(ceil(Double(skyCount) * 0.0015)))
        var seen = Array(repeating: false, count: cloudScores.count)
        var proposals: [CloudRegionProposal] = []
        func skyCoverage(left: Int, top: Int, right: Int, bottom: Int) -> Double {
            var count = 0
            for y in top..<bottom { for x in left..<right {
                if eligible[y * columns + x] { count += 1 }
            } }
            return Double(count) / Double((right - left) * (bottom - top))
        }
        for start in cloudScores.indices where !seen[start] && eligible[start] && cloudScores[start] >= 0.5 {
            var members = [start], cursor = 0
            seen[start] = true
            var left = start % columns, right = left + 1, top = start / columns, bottom = top + 1
            while cursor < members.count {
                let cell = members[cursor], x = cell % columns, y = cell / columns
                cursor += 1
                left = min(left, x); right = max(right, x + 1)
                top = min(top, y); bottom = max(bottom, y + 1)
                for dy in -1...1 { for dx in -1...1 where dx != 0 || dy != 0 {
                    let nx = x + dx, ny = y + dy
                    guard nx >= 0, nx < columns, ny >= 0, ny < rows else { continue }
                    let next = ny * columns + nx
                    if !seen[next] && eligible[next] && cloudScores[next] >= 0.5 {
                        seen[next] = true
                        members.append(next)
                    }
                } }
            }
            guard members.count >= minimumArea, right - left >= 4, bottom - top >= 4 else { continue }
            let rawCoverage = skyCoverage(left: left, top: top, right: right, bottom: bottom)
            guard rawCoverage >= 0.7 else { continue }
            let dx = max(2, Int(ceil(Double(right - left) * 0.1)))
            let dy = max(2, Int(ceil(Double(bottom - top) * 0.1)))
            let padded = (max(0, left - dx), max(0, top - dy), min(columns, right + dx), min(rows, bottom + dy))
            if skyCoverage(left: padded.0, top: padded.1, right: padded.2, bottom: padded.3) >= max(0.7, rawCoverage - 0.05) {
                (left, top, right, bottom) = padded
            }
            // The box center may be clear sky or foreground. Anchor only on a mask member.
            let cx = Double(left + right) / 2, cy = Double(top + bottom) / 2
            func centerDistance(_ cell: Int) -> Double {
                pow(Double(cell % columns) + 0.5 - cx, 2) + pow(Double(cell / columns) + 0.5 - cy, 2)
            }
            let anchorCell = members.min { a, b in
                let da = centerDistance(a), db = centerDistance(b)
                return da == db ? a < b : da < db
            }!
            let anchor = CGPoint(x: (Double(anchorCell % columns) + 0.5) / Double(columns),
                                 y: (Double(anchorCell / columns) + 0.5) / Double(rows))
            proposals.append(CloudRegionProposal(bounds: CGRect(x: Double(left) / Double(columns), y: Double(top) / Double(rows),
                width: Double(right - left) / Double(columns), height: Double(bottom - top) / Double(rows)),
                patchCount: members.count, anchor: anchor))
        }
        proposals.sort {
            if $0.patchCount != $1.patchCount { return $0.patchCount > $1.patchCount }
            if $0.bounds.minY != $1.bounds.minY { return $0.bounds.minY < $1.bounds.minY }
            return $0.bounds.minX < $1.bounds.minX
        }
        return Array(proposals.prefix(limit))
    }

    static func propose(features: [Float], columns: Int, rows: Int, channels: Int,
                        content: CGRect, skyScores: [Float]? = nil, limit: Int = 5) throws -> [CloudRegionProposal] {
        guard columns > 0, rows > 0, columns <= 64, rows <= 64,
              channels > 0, channels <= 2048, features.count == columns * rows * channels,
              features.allSatisfy({ $0.isFinite }),
              [content.minX, content.minY, content.width, content.height].allSatisfy({ $0.isFinite }),
              content.minX >= 0, content.minY >= 0, content.maxX <= 1.000001,
              content.maxY <= 1.000001, content.width > 0, content.height > 0,
              limit > 0, limit <= 8 else { throw ProposalError.invalidFeatures }
        if let skyScores {
            guard skyScores.count == columns * rows,
                  skyScores.allSatisfy({ $0.isFinite && $0 >= 0 && $0 <= 1 }) else {
                throw ProposalError.invalidFeatures
            }
        }

        var indices: [Int] = []
        var vectors: [[Float]] = []
        for index in 0..<(columns * rows) {
            let x = (Double(index % columns) + 0.5) / Double(columns)
            let y = (Double(index / columns) + 0.5) / Double(rows)
            guard content.contains(CGPoint(x: x, y: y)),
                  skyScores == nil || skyScores![index] >= 0.7 else { continue }
            let start = index * channels
            var vector = Array(features[start..<(start + channels)])
            let magnitude = sqrt(vector.reduce(Float(0)) { $0 + $1 * $1 })
            guard magnitude > 0.000001 else { continue }
            vector = vector.map { $0 / magnitude }
            // Weak position regularization limits fragmented texture clusters.
            vector.append(Float((x - content.midX) / content.width) * 0.2)
            vector.append(Float((y - content.midY) / content.height) * 0.2)
            indices.append(index)
            vectors.append(vector)
        }
        guard vectors.count >= 12 else { return [] }
        func distance(_ a: [Float], _ b: [Float]) -> Float {
            zip(a, b).reduce(Float(0)) { total, pair in
                let delta = pair.0 - pair.1
                return total + delta * delta
            }
        }
        var centers = [vectors[0]]
        while centers.count < 3 {
            let distances = vectors.map { vector in centers.map { distance(vector, $0) }.min()! }
            guard let maximum = distances.max(), maximum > 0.2,
                  let index = distances.firstIndex(of: maximum) else { break }
            centers.append(vectors[index])
        }
        guard centers.count > 1 else { return [] }
        var labels = Array(repeating: 0, count: vectors.count)
        for _ in 0..<8 {
            for index in vectors.indices {
                let values = centers.map { distance(vectors[index], $0) }
                labels[index] = values.firstIndex(of: values.min()!)!
            }
            for cluster in centers.indices {
                let members = vectors.indices.filter { labels[$0] == cluster }
                guard !members.isEmpty else { continue }
                var mean = Array(repeating: Float(0), count: channels + 2)
                for index in members {
                    for channel in mean.indices { mean[channel] += vectors[index][channel] }
                }
                centers[cluster] = mean.map { $0 / Float(members.count) }
            }
        }
        var grid = Array(repeating: -1, count: columns * rows)
        for index in indices.indices { grid[indices[index]] = labels[index] }
        var seen = Set<Int>()
        var proposals: [CloudRegionProposal] = []
        func skyCoverage(_ rect: CGRect) -> Double {
            guard let skyScores else { return 1 }
            var sky = 0.0, area = 0.0
            for y in 0..<rows { for x in 0..<columns {
                let cell = CGRect(x: Double(x) / Double(columns), y: Double(y) / Double(rows),
                                  width: 1 / Double(columns), height: 1 / Double(rows))
                let overlap = cell.intersection(rect)
                guard !overlap.isNull else { continue }
                let weight = overlap.width * overlap.height
                sky += weight * Double(skyScores[y * columns + x])
                area += weight
            } }
            return area > 0 ? sky / area : 0
        }
        for start in indices where !seen.contains(start) {
            let cluster = grid[start]
            var members = [start], cursor = 0
            seen.insert(start)
            while cursor < members.count {
                let cell = members[cursor]
                cursor += 1
                let x = cell % columns, y = cell / columns
                let neighbors = [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
                for (nx, ny) in neighbors where nx >= 0 && nx < columns && ny >= 0 && ny < rows {
                    let next = ny * columns + nx
                    if grid[next] == cluster && !seen.contains(next) {
                        seen.insert(next)
                        members.append(next)
                    }
                }
            }
            guard members.count >= 4, Double(members.count) < Double(indices.count) * 0.85 else { continue }
            let xs = members.map { $0 % columns }, ys = members.map { $0 / columns }
            let raw = CGRect(x: Double(xs.min()!) / Double(columns), y: Double(ys.min()!) / Double(rows),
                             width: Double(xs.max()! - xs.min()! + 1) / Double(columns),
                             height: Double(ys.max()! - ys.min()! + 1) / Double(rows))
            guard raw.width >= 2 / Double(columns), raw.height >= 2 / Double(rows) else { continue }
            var padded = raw.insetBy(dx: -max(1 / Double(columns), raw.width * 0.15),
                                     dy: -max(1 / Double(rows), raw.height * 0.15)).intersection(content)
            if skyCoverage(padded) < 0.85 { padded = raw.intersection(content) }
            guard skyCoverage(padded) >= 0.85 else { continue }
            let bounds = CGRect(x: (padded.minX - content.minX) / content.width,
                                y: (padded.minY - content.minY) / content.height,
                                width: padded.width / content.width, height: padded.height / content.height)
            guard bounds.width * bounds.height < 0.92 else { continue }
            proposals.append(CloudRegionProposal(bounds: bounds, patchCount: members.count))
        }
        proposals.sort {
            if $0.patchCount != $1.patchCount { return $0.patchCount > $1.patchCount }
            if $0.bounds.minY != $1.bounds.minY { return $0.bounds.minY < $1.bounds.minY }
            return $0.bounds.minX < $1.bounds.minX
        }
        var selected: [CloudRegionProposal] = []
        for proposal in proposals {
            let duplicate = selected.contains { previous in
                let intersection = proposal.bounds.intersection(previous.bounds)
                let area = intersection.isNull ? 0 : intersection.width * intersection.height
                let union = proposal.bounds.width * proposal.bounds.height + previous.bounds.width * previous.bounds.height - area
                return union > 0 && area / union > 0.65
            }
            if !duplicate { selected.append(proposal) }
            if selected.count == limit { break }
        }
        return selected
    }

    enum ProposalError: Error { case invalidFeatures }
}
