"""Flag cropped photograph reuse for human review, without modifying labels."""

import argparse
from collections import Counter
import hashlib
from itertools import chain, combinations, product
import json
from pathlib import Path
import re

import cv2
import numpy as np
from PIL import Image, ImageOps

from audit_ccaim_metadata import MANIFEST_SHA256, load_pinned
from audit_ccaim_photos import PROFILE_SHA256
from labels import GENERA


PARAMETERS = dict(long_edge=800, features=800, ratio=0.7, min_matches=18,
                  reprojection_px=3.0, min_inlier_fraction=0.65,
                  min_hull_fraction=0.08, min_overlap_fraction=0.1,
                  max_overlap_fraction=0.6, min_gray_std=4.0,
                  min_correlation=0.94, max_normalized_residual=0.2)


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def configure():
    cv2.setNumThreads(2)
    cv2.setRNGSeed(13042)


def features(image):
    image = ImageOps.exif_transpose(image).convert("L")
    image.thumbnail((PARAMETERS["long_edge"],) * 2, Image.Resampling.LANCZOS)
    gray = np.asarray(image).copy()
    detector = cv2.SIFT_create(nfeatures=PARAMETERS["features"])
    points, descriptors = detector.detectAndCompute(gray, None)
    return gray, np.float32([point.pt for point in points]).reshape(-1, 2), descriptors


def hull_fraction(points, shape):
    return float(cv2.contourArea(cv2.convexHull(points))) / (shape[0] * shape[1])


def compare(left, right):
    a, a_points, a_descriptors = left
    b, b_points, b_descriptors = right
    result = {"status": "not_flagged", "reason": "insufficient_features"}
    if min(len(a_points), len(b_points)) < PARAMETERS["min_matches"]:
        return result
    matcher = cv2.BFMatcher(cv2.NORM_L2)

    def ratio_matches(source, target):
        return {first.queryIdx: first.trainIdx for pair in matcher.knnMatch(source, target, k=2)
                if len(pair) == 2 for first, second in [pair]
                if first.distance < PARAMETERS["ratio"] * second.distance}

    forward = ratio_matches(a_descriptors, b_descriptors)
    backward = ratio_matches(b_descriptors, a_descriptors)
    mutual = [(i, j) for i, j in forward.items() if backward.get(j) == i]
    result.update(matches=len(mutual), reason="insufficient_mutual_matches")
    if len(mutual) < PARAMETERS["min_matches"]:
        return result
    source = np.float32([a_points[i] for i, _ in mutual])
    target = np.float32([b_points[j] for _, j in mutual])
    # A single photograph crop preserves scale/rotation; no flexible homography.
    cv2.setRNGSeed(13042)
    transform, inliers = cv2.estimateAffinePartial2D(
        source, target, method=cv2.RANSAC,
        ransacReprojThreshold=PARAMETERS["reprojection_px"], maxIters=2000,
        confidence=0.995, refineIters=20)
    result["reason"] = "inconsistent_geometry"
    if transform is None or inliers is None or not np.isfinite(transform).all():
        return result
    mask = inliers.ravel().astype(bool)
    result.update(inliers=int(mask.sum()), inlier_fraction=float(mask.mean()))
    if mask.sum() < PARAMETERS["min_matches"] or mask.mean() < PARAMETERS["min_inlier_fraction"]:
        return result
    hulls = [hull_fraction(source[mask], a.shape), hull_fraction(target[mask], b.shape)]
    result.update(hull_fractions=hulls, reason="localized_feature_overlap")
    if min(hulls) < PARAMETERS["min_hull_fraction"]:
        return result
    size = (b.shape[1], b.shape[0])
    warped = cv2.warpAffine(a, transform, size, flags=cv2.INTER_LINEAR)
    valid = cv2.warpAffine(np.ones(a.shape, np.uint8), transform, size,
                          flags=cv2.INTER_NEAREST)
    valid = cv2.erode(valid, np.ones((3, 3), np.uint8)).astype(bool)
    scale_area = abs(float(np.linalg.det(transform[:, :2])))
    overlaps = [float(valid.sum()) / (a.size * scale_area), float(valid.mean())]
    result.update(overlap_fractions=overlaps, reason="insufficient_photo_overlap")
    if min(overlaps) < PARAMETERS["min_overlap_fraction"] or max(overlaps) < PARAMETERS["max_overlap_fraction"]:
        return result
    x, y = warped[valid].astype(np.float64), b[valid].astype(np.float64)
    result["reason"] = "low_information_overlap"
    if min(x.std(), y.std()) < PARAMETERS["min_gray_std"]:
        return result
    x = (x - x.mean()) / x.std()
    y = (y - y.mean()) / y.std()
    correlation = float(np.mean(x * y))
    residual = float(np.mean(np.abs(y - correlation * x)))
    result.update(correlation=correlation, normalized_residual=residual,
                  transform=transform.tolist(), reason="different_aligned_pixels")
    if correlation >= PARAMETERS["min_correlation"] and residual <= PARAMETERS["max_normalized_residual"]:
        result.update(status="candidate", reason="geometric_and_pixel_agreement")
    return result


def load_sample(directory):
    selection_path, downloads_path = directory / "selection.json", directory / "downloads.json"
    selection = json.loads(selection_path.read_text())
    downloads = json.loads(downloads_path.read_text())
    if selection.get("training_approved") is not False or selection.get("fresh_test_approved") is not False:
        raise ValueError("Expected an unapproved development audit")
    rows = selection["photos"]
    ids = [row["audit_id"] for row in rows]
    if (not 1 <= len(rows) <= 256 or len(set(ids)) != len(ids)
            or any(not re.fullmatch(r"C[0-9]{3}", identifier) for identifier in ids)
            or set(ids) != set(downloads)):
        raise ValueError("Invalid or mismatched sample IDs")
    prepared, evidence = {}, []
    for row in rows:
        identifier = row["audit_id"]
        path = directory / "photos" / f"{identifier}.jpg"
        receipt = downloads[identifier]
        if (receipt.get("status") != "downloaded" or receipt["sha256"] != row["sha256"]
                or path.stat().st_size != row["size"] or sha256(path) != row["sha256"]):
            raise ValueError(f"Photo differs from its frozen receipt: {identifier}")
        with Image.open(path) as image:
            prepared[identifier] = features(image)
        evidence.append({"id": identifier, "sha256": row["sha256"],
                         "source_label": row["source_label"], "features": len(prepared[identifier][1])})
    return prepared, {"selection_sha256": sha256(selection_path),
                      "downloads_sha256": sha256(downloads_path), "photos": evidence}


def load_previous(manifest_path, profile_path):
    manifest = load_pinned(manifest_path, MANIFEST_SHA256)
    profile = load_pinned(profile_path, PROFILE_SHA256)
    receipts = {row["previous_id"]: row["sha256"] for row in profile["previous_overlap"]["matches"]}
    rows = [row for row in manifest["rows"] if row["source"] == "ccaim-old"]
    if len(receipts) != len(rows) or set(receipts) != {row["id"] for row in rows}:
        raise ValueError("Prior-source receipts do not cover every frozen row")
    prepared, evidence, by_hash = {}, [], {}
    for row in sorted(rows, key=lambda row: row["id"]):
        path = Path(row["path"])
        digest = sha256(path)
        if digest != receipts[row["id"]]:
            raise ValueError("Prior-source photo differs from its pinned audit")
        alias = {"id": row["id"], "split": row["split"], "source_label": GENERA[row["label"]]}
        if digest in by_hash:
            by_hash[digest]["aliases"].append(alias)
            continue
        with Image.open(path) as image:
            prepared[row["id"]] = features(image)
        receipt = {"id": row["id"], "sha256": digest, "aliases": [alias],
                   "features": len(prepared[row["id"]][1])}
        evidence.append(receipt)
        by_hash[digest] = receipt
    return prepared, {"manifest_sha256": MANIFEST_SHA256, "profile_sha256": PROFILE_SHA256,
                      "source": "ccaim-old", "rows": len(rows), "photos": evidence}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--previous-manifest", type=Path)
    parser.add_argument("--previous-profile", type=Path)
    args = parser.parse_args()
    if bool(args.previous_manifest) != bool(args.previous_profile):
        parser.error("Previous manifest and profile must be provided together")
    if args.output.exists():
        raise FileExistsError("Preserve the previous audit; choose a new output")
    configure()
    prepared, evidence = load_sample(args.sample)
    previous, previous_evidence = {}, None
    if args.previous_manifest:
        previous, previous_evidence = load_previous(args.previous_manifest, args.previous_profile)
    comparisons = chain(
        ((a, b, "audit_sample") for a, b in combinations(sorted(prepared), 2)),
        ((a, b, "previous_ccaim") for a, b in product(sorted(prepared), sorted(previous))))
    pairs, reasons = [], Counter()
    for index, (left, right, scope) in enumerate(comparisons, 1):
        result = compare(prepared[left], (prepared if scope == "audit_sample" else previous)[right])
        reasons[result["reason"]] += 1
        if result["status"] == "candidate":
            pairs.append({"left": left, "right": right, "scope": scope, **result})
            print(json.dumps(pairs[-1]), flush=True)
        if index % 200 == 0:
            print(f"Compared {index} pairs", flush=True)
    report = {"schema": 1, "parameters": PARAMETERS, "opencv": cv2.__version__,
              "numpy": np.__version__, "code_sha256": sha256(Path(__file__)),
              "scope": "development sample and, if supplied, previously exposed CCAiM only; all candidates require visual review",
              "limitation": "Not-flagged pairs are not proven independent. Source labels are not verified.",
              "training_approved": False, "fresh_test_approved": False, "labels_applied": 0,
              **evidence, "previous": previous_evidence,
              "pair_count": sum(reasons.values()), "reasons": dict(reasons), "candidates": pairs}
    with args.output.open("x", encoding="utf-8") as stream:
        stream.write(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"photos": len(prepared), "pairs": report["pair_count"],
                      "candidates": len(pairs), "labels_applied": 0}), flush=True)


if __name__ == "__main__":
    main()
