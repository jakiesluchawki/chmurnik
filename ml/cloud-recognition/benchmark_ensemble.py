"""Select and evaluate a calibrated v2/v3 probability ensemble."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from torch.utils.data import ConcatDataset, DataLoader

from benchmark_curated import OUTLIERS, label as atlas_label
from labels import GENERA
from model import build_model
from train_ccsn import ClearDataset as V2ClearDataset
from train_ccsn import PhotoDataset as V2PhotoDataset
from train_ccsn import collect as collect_v2
from train_ccsn import choose_policy, softmax
from train_v3 import ClearDataset as V3ClearDataset
from train_v3 import PhotoDataset as V3PhotoDataset
from train_v3 import collect, random_split


def load_checkpoint(path: Path):
    checkpoint = torch.load(path, map_location="cpu", weights_only=True)
    model = build_model(
        len(GENERA),
        architecture=checkpoint.get("architecture", "mobilenet_v3_small"),
    )
    model.load_state_dict(checkpoint["state_dict"])
    return checkpoint, model.eval()


@torch.inference_mode()
def predict(model, checkpoint: dict, dataset, horizontal_flip_tta: bool = False) -> np.ndarray:
    rows = []
    for images, _, _ in DataLoader(dataset, batch_size=32):
        values = softmax(model(images).numpy(), checkpoint["temperature"])
        if horizontal_flip_tta:
            flipped = softmax(
                model(torch.flip(images, dims=(3,))).numpy(),
                checkpoint["temperature"],
            )
            values = 0.5 * (values + flipped)
        rows.append(values)
    return np.concatenate(rows)


def photo_dataset(items, checkpoint: dict):
    if checkpoint.get("pipeline_version") == 3:
        return V3PhotoDataset(
            items,
            False,
            checkpoint["input_size"],
            checkpoint.get("preprocess", "full_frame"),
        )
    return V2PhotoDataset(items, False)


def clear_dataset(payload: dict, indices: list[int], checkpoint: dict):
    if checkpoint.get("pipeline_version") == 3:
        return V3ClearDataset(
            payload,
            indices,
            False,
            checkpoint["input_size"],
            checkpoint.get("preprocess", "full_frame"),
        )
    return V2ClearDataset(payload, indices, False)


def ensemble_probabilities(
    items,
    base_model,
    base_checkpoint,
    candidate_model,
    candidate_checkpoint,
    base_weight: float,
    horizontal_flip_tta: bool = False,
):
    base = predict(
        base_model,
        base_checkpoint,
        photo_dataset(items, base_checkpoint),
        horizontal_flip_tta,
    )
    candidate = predict(
        candidate_model,
        candidate_checkpoint,
        photo_dataset(items, candidate_checkpoint),
        horizontal_flip_tta,
    )
    return base_weight * base + (1 - base_weight) * candidate


def probability_report(values: np.ndarray, labels: np.ndarray, policy: dict, include_clear: bool) -> dict:
    order = np.argsort(-values, axis=1)
    confidence = values[np.arange(len(values)), order[:, 0]]
    margin = confidence - values[np.arange(len(values)), order[:, 1]]
    accepted = (confidence >= policy["minimum_confidence"]) & (margin >= policy["margin_threshold"])
    top1 = order[:, 0] == labels
    top3 = np.array([labels[index] in order[index, :3] for index in range(len(order))])
    report_labels = list(range(len(GENERA) if include_clear else len(GENERA) - 1))
    report_names = GENERA if include_clear else GENERA[:-1]
    details = classification_report(
        labels,
        order[:, 0],
        labels=report_labels,
        target_names=report_names,
        zero_division=0,
        output_dict=True,
    )
    family_groups = [(0, 1, 2), (3, 4), (5, 6, 7), (8, 9)]
    if include_clear:
        family_groups.append((10,))
    family_by_class = {
        class_index: family_index
        for family_index, group in enumerate(family_groups)
        for class_index in group
    }
    family_labels = np.array([family_by_class[int(label)] for label in labels])
    family_reports = {}
    for method in ("sum", "mean", "max"):
        family_values = []
        for group in family_groups:
            selected = values[:, group]
            if method == "sum":
                family_values.append(selected.sum(axis=1))
            elif method == "mean":
                family_values.append(selected.mean(axis=1))
            else:
                family_values.append(selected.max(axis=1))
        family_values = np.stack(family_values, axis=1)
        family_order = np.argsort(-family_values, axis=1)
        family_reports[method] = {
            "top1_accuracy": float(np.mean(family_order[:, 0] == family_labels)),
            "top2_accuracy": float(
                np.mean(
                    [
                        family_labels[index] in family_order[index, :2]
                        for index in range(len(family_labels))
                    ]
                )
            ),
            "macro_f1": float(
                f1_score(
                    family_labels,
                    family_order[:, 0],
                    labels=list(range(len(family_groups))),
                    average="macro",
                    zero_division=0,
                )
            ),
        }
    return {
        "sample_count": len(labels),
        "top1_accuracy": float(top1.mean()),
        "top3_accuracy": float(top3.mean()),
        "macro_f1": float(details["macro avg"]["f1-score"]),
        "selective_precision": float(top1[accepted].mean()) if accepted.any() else None,
        "selective_coverage": float(accepted.mean()),
        "accepted_count": int(accepted.sum()),
        "confusion_matrix": confusion_matrix(labels, order[:, 0], labels=report_labels).tolist(),
        "classes": {name: details[name] for name in report_names},
        "families": family_reports,
    }


def directory_items(root: Path) -> list[tuple[Path, int]]:
    items = []
    for index, genus in enumerate(GENERA[:-1]):
        directory = root / genus
        items.extend(
            (path, index)
            for path in sorted(directory.iterdir())
            if path.suffix.lower() in {".jpg", ".png"}
        )
    return items


def common_holdout(
    base_known: dict[str, list[tuple[Path, int]]],
    candidate_known: dict[str, list[tuple[Path, int]]],
    seed: int,
) -> dict[str, list[tuple[Path, int]]]:
    result = {"calibration": [], "test": []}
    for label in range(len(GENERA) - 1):
        base_train = {path for path, value in base_known["train"] if value == label}
        candidate_train = {
            path for path, value in candidate_known["train"] if value == label
        }
        all_paths = {
            path
            for split in ("train", "val", "test")
            for path, value in base_known[split]
            if value == label
        }
        paths = sorted(all_paths - base_train - candidate_train)
        random = np.random.default_rng(seed + label * 101)
        random.shuffle(paths)
        middle = len(paths) // 2
        result["calibration"].extend((path, label) for path in paths[:middle])
        result["test"].extend((path, label) for path in paths[middle:])
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--clear", type=Path, required=True)
    parser.add_argument("--atlas", type=Path, required=True)
    parser.add_argument("--commons", type=Path, required=True)
    parser.add_argument("--noisy-stress", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--duplicate-distance", type=int, default=8)
    parser.add_argument("--target-precision", type=float, default=0.85)
    parser.add_argument("--horizontal-flip-tta", action="store_true")
    args = parser.parse_args()

    base_checkpoint, base_model = load_checkpoint(args.base)
    candidate_checkpoint, candidate_model = load_checkpoint(args.candidate)
    base_known, base_outliers = collect_v2(args.data, args.seed)
    candidate_known, candidate_outliers, _ = collect(
        args.data, args.seed, args.duplicate_distance
    )
    known = common_holdout(base_known, candidate_known, args.seed + 9001)
    clear = torch.load(args.clear, map_location="cpu", weights_only=True, mmap=True)
    clear_splits = random_split(len(clear["images"]), args.seed + 8101)

    clear_holdout = clear_splits["val"] + clear_splits["test"]
    np.random.default_rng(args.seed + 9101).shuffle(clear_holdout)
    clear_middle = len(clear_holdout) // 2
    common_clear = {
        "calibration": clear_holdout[:clear_middle],
        "test": clear_holdout[clear_middle:],
    }

    split_probabilities = {}
    split_labels = {}
    for split in ("calibration", "test"):
        labels = np.array(
            [label for _, label in known[split]]
            + [len(GENERA) - 1] * len(common_clear[split])
        )
        base_dataset = ConcatDataset(
            [
                photo_dataset(known[split], base_checkpoint),
                clear_dataset(clear, common_clear[split], base_checkpoint),
            ]
        )
        candidate_dataset = ConcatDataset(
            [
                photo_dataset(known[split], candidate_checkpoint),
                clear_dataset(clear, common_clear[split], candidate_checkpoint),
            ]
        )
        split_probabilities[split] = (
            predict(base_model, base_checkpoint, base_dataset, args.horizontal_flip_tta),
            predict(candidate_model, candidate_checkpoint, candidate_dataset, args.horizontal_flip_tta),
        )
        split_labels[split] = labels

    candidates = []
    for base_weight in np.linspace(0, 1, 21):
        base, candidate = split_probabilities["calibration"]
        values = base_weight * base + (1 - base_weight) * candidate
        predictions = values.argmax(axis=1)
        candidates.append(
            {
                "base_weight": float(base_weight),
                "macro_f1": float(
                    f1_score(
                        split_labels["calibration"],
                        predictions,
                        labels=list(range(len(GENERA))),
                        average="macro",
                        zero_division=0,
                    )
                ),
                "accuracy": float(
                    np.mean(predictions == split_labels["calibration"])
                ),
            }
        )
    selected = max(candidates, key=lambda row: (row["macro_f1"], row["accuracy"]))
    base_weight = selected["base_weight"]
    validation_values = (
        base_weight * split_probabilities["calibration"][0]
        + (1 - base_weight) * split_probabilities["calibration"][1]
    )
    policy = choose_policy(
        validation_values,
        split_labels["calibration"],
        args.target_precision,
    )
    test_values = (
        base_weight * split_probabilities["test"][0]
        + (1 - base_weight) * split_probabilities["test"][1]
    )

    reports = {
        "calibration": probability_report(
            validation_values,
            split_labels["calibration"],
            policy,
            True,
        ),
        "test": probability_report(test_values, split_labels["test"], policy, True),
        "base_common_test": probability_report(
            split_probabilities["test"][0],
            split_labels["test"],
            policy,
            True,
        ),
        "candidate_common_test": probability_report(
            split_probabilities["test"][1],
            split_labels["test"],
            policy,
            True,
        ),
    }
    external_sets = {
        "application_atlas": [
            (path, atlas_label(path)) for path in sorted(args.atlas.glob("*.jpg"))
        ],
        "commons_benchmark": directory_items(args.commons),
        "noisy_stress_set": directory_items(args.noisy_stress),
    }
    for name, items in external_sets.items():
        values = ensemble_probabilities(
            items,
            base_model,
            base_checkpoint,
            candidate_model,
            candidate_checkpoint,
            base_weight,
            args.horizontal_flip_tta,
        )
        reports[name] = probability_report(
            values,
            np.array([label for _, label in items]),
            policy,
            False,
        )

    base_outlier_train = {path for path, _ in base_outliers["train"]}
    candidate_outlier_train = {path for path, _ in candidate_outliers["train"]}
    all_outlier_paths = {
        path
        for split in ("train", "val", "test")
        for path, _ in base_outliers[split]
    }
    common_outliers = sorted(
        all_outlier_paths - base_outlier_train - candidate_outlier_train
    )
    outlier_items = [(path, -1) for path in common_outliers] + [
        (path, -1) for path in OUTLIERS
    ]
    outlier_values = ensemble_probabilities(
        outlier_items,
        base_model,
        base_checkpoint,
        candidate_model,
        candidate_checkpoint,
        base_weight,
        args.horizontal_flip_tta,
    )
    order = np.argsort(-outlier_values, axis=1)
    confidence = outlier_values[np.arange(len(outlier_values)), order[:, 0]]
    margin = confidence - outlier_values[np.arange(len(outlier_values)), order[:, 1]]
    accepted = (confidence >= policy["minimum_confidence"]) & (margin >= policy["margin_threshold"])
    reports["outliers"] = {
        "sample_count": len(outlier_items),
        "abstention_rate": float((~accepted).mean()),
        "accepted_count": int(accepted.sum()),
    }

    result = {
        "base_checkpoint": str(args.base),
        "candidate_checkpoint": str(args.candidate),
        "base_weight": base_weight,
        "candidate_weight": 1 - base_weight,
        "horizontal_flip_tta": args.horizontal_flip_tta,
        "weight_selection": candidates,
        "abstention_policy": policy,
        "reports": reports,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(
        json.dumps(
            {
                "base_weight": base_weight,
                "policy": policy,
                "reports": {
                    name: {
                        key: value[key]
                        for key in value
                        if key in {
                            "top1_accuracy",
                            "top3_accuracy",
                            "macro_f1",
                            "selective_precision",
                            "selective_coverage",
                            "abstention_rate",
                        }
                    }
                    for name, value in reports.items()
                },
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
