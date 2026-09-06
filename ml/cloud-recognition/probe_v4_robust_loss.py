"""One paired GCE training probe on frozen development features, never holdouts."""

import argparse
import copy
import json
from pathlib import Path
import time

import numpy as np
from sklearn.metrics import confusion_matrix, f1_score
import torch
from torch.nn import functional as F
from torch.utils.data import DataLoader, TensorDataset

from dinov2_model import FeatureMLP
from labels import GENERA
from probe_v4_cross_backbone import checked_features
from train_v4_dinob import MANIFEST_SHA256, sha256
from v4_checkpoint import atomic_save
from v4_data import validate_manifest
from v4_metrics import unique_labeled_rows


Q = .7
BAR = .6545474034701404
FEATURE_SHA = {
    "train": "74e2116e9358198404267608a74b192e173bb3f289f9cb6cc937ec99d8a6b4b7",
    "validation": "0376ac821a6c9cc587d117e72d3a13c95c31ee84a201783c1c2bc69a40c87ef1",
}
REFERENCE_SHA = "671382d070d721e4e31d699516264ceffc60bf8231129b24d73b96a8b25a4dbe"
CONTROL_SHA = "2d6b265314d435d52d09cfdb1c34486155d090fc4e26a85cde3bf08b2d68b5fa"


def generalized_loss(logits, labels, weights, *, q=Q, smoothing=.05):
    if (logits.ndim != 2 or not len(logits) or logits.shape[1] < 2
            or not logits.is_floating_point() or not torch.isfinite(logits).all()
            or labels.shape != (len(logits),) or labels.dtype != torch.long
            or weights.shape != (logits.shape[1],) or not torch.isfinite(weights).all()
            or (weights <= 0).any() or not 0 <= q <= 1 or not 0 <= smoothing < 1
            or (labels < 0).any() or (labels >= logits.shape[1]).any()):
        raise ValueError("Invalid weighted GCE inputs")
    if q == 0:
        return F.cross_entropy(logits, labels, weight=weights, label_smoothing=smoothing)
    log_probabilities = F.log_softmax(logits, dim=1)
    # expm1 avoids cancellation near q=0; q=0 itself retains the exact control.
    losses = -torch.expm1(q * log_probabilities) / q
    desired = F.one_hot(labels, logits.shape[1]).to(logits.dtype)
    desired = desired * (1 - smoothing) + smoothing / logits.shape[1]
    return (desired * weights * losses).sum() / weights[labels].sum()


def fit_arm(x, y, v, vy, output, *, q):
    torch.manual_seed(7042)
    head = FeatureMLP(len(GENERA))
    head.mean.copy_(x.mean(0))
    head.scale.copy_(x.std(0).clamp(min=1e-6))
    counts = torch.bincount(y, minlength=len(GENERA))
    if (counts == 0).any():
        raise ValueError("Missing training class")
    weights = counts.max().float().div(counts).sqrt()
    optimizer = torch.optim.AdamW(head.parameters(), lr=.001, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, 200, eta_min=.00001)
    loader = DataLoader(TensorDataset(x, y), batch_size=64, shuffle=True,
                        generator=torch.Generator().manual_seed(7042))
    history, best, best_epoch, selected = [], -1., 0, None
    for epoch in range(1, 201):
        head.train()
        total_loss = 0.
        for features, labels in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = generalized_loss(head(features), labels, weights, q=q)
            if not torch.isfinite(loss):
                raise ValueError("Non-finite training loss")
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach())
        scheduler.step()
        head.eval()
        with torch.inference_mode():
            logits = head(v).detach().clone()
        if not torch.isfinite(logits).all():
            raise ValueError("Non-finite validation logits")
        predicted = logits.argmax(1)
        row = {"epoch": epoch, "correct": int((predicted == vy).sum()), "total": len(vy),
               "accuracy": float((predicted == vy).double().mean()),
               "macro_f1": float(f1_score(vy, predicted, labels=list(range(len(GENERA))),
                                           average="macro", zero_division=0)),
               "mean_batch_loss": total_loss / len(loader)}
        history.append(row)
        if row["macro_f1"] > best:
            best, best_epoch = row["macro_f1"], epoch
            selected = {"state": copy.deepcopy(head.state_dict()), "validation": row,
                        "logits": logits, "q": q}
            atomic_save(selected, output / "head.pt")
        (output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        if epoch % 10 == 0:
            print(json.dumps({"arm": output.name, **row, "best_epoch": best_epoch}), flush=True)
        if epoch >= 30 and epoch - best_epoch >= 20:
            break
    return {"validation": selected["validation"], "epochs": epoch,
            "head_sha256": sha256(output / "head.pt")}


def control_parity(actual, expected):
    if (actual.shape != expected.shape or actual.ndim != 2 or not actual.numel()
            or not torch.isfinite(actual).all() or not torch.isfinite(expected).all()):
        raise ValueError("Invalid control logits")
    error = float((actual - expected).abs().max())
    changes = int((actual.argmax(1) != expected.argmax(1)).sum())
    if error > 1e-6 or changes:
        raise ValueError(f"Paired control does not reproduce the retained trial: {error}, {changes}")
    return {"max_logit_error": error, "top1_changes": changes}


def summarize(labels, predicted):
    if (labels.shape != predicted.shape or labels.ndim != 1 or not len(labels)
            or any(not np.issubdtype(a.dtype, np.integer) for a in (labels, predicted))
            or any((a < 0).any() or (a >= len(GENERA)).any() for a in (labels, predicted))):
        raise ValueError("Invalid classification population")
    present = sorted(set(labels.tolist()))
    return {"count": len(labels), "correct": int((predicted == labels).sum()),
            "accuracy": float(np.mean(predicted == labels)),
            "macro_f1": float(f1_score(labels, predicted, labels=present, average="macro", zero_division=0)),
            "macro_f1_all_classes": float(f1_score(labels, predicted, labels=list(range(len(GENERA))),
                                                    average="macro", zero_division=0)),
            "confusion": confusion_matrix(labels, predicted, labels=list(range(len(GENERA)))).tolist()}


def validation_populations(rows):
    if (not rows or any(r["split"] != "validation" for r in rows)
            or len({r["id"] for r in rows}) != len(rows)):
        raise ValueError("Complete unique-ID validation rows only")
    unique, excluded = unique_labeled_rows(rows)
    positions = {r["id"]: i for i, r in enumerate(rows)}
    indices = np.asarray([positions[r["id"]] for r in unique], dtype=int)
    labels = np.asarray([r["label"] for r in rows])
    populations = {"raw_all": np.arange(len(rows)), "unique_all": indices,
                   "raw_clouds": np.flatnonzero(labels < len(GENERA) - 1),
                   "unique_clouds": indices[labels[indices] < len(GENERA) - 1]}
    for source in sorted({r["source"] for r in rows}):
        populations[f"source_{source}"] = np.asarray([i for i, r in enumerate(rows) if r["source"] == source])
    for label in sorted(set(labels.tolist())):
        populations[f"class_{GENERA[label]}"] = np.flatnonzero(labels == label)
    return populations, excluded


def eligible(candidate, control, reference):
    return (candidate["raw_all"]["macro_f1"] >= BAR
            and candidate["raw_all"]["macro_f1"] > control["raw_all"]["macro_f1"]
            and candidate["raw_all"]["correct"] >= reference["raw_all"]["correct"]
            and candidate["raw_clouds"]["correct"] >= reference["raw_clouds"]["correct"]
            and candidate["unique_all"]["macro_f1"] >= reference["unique_all"]["macro_f1"])


def main():
    parser = argparse.ArgumentParser()
    for name in ("manifest", "features", "reference", "control", "output"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the prior or interrupted experiment")
    if (sha256(args.manifest) != MANIFEST_SHA256 or sha256(args.reference) != REFERENCE_SHA
            or sha256(args.control) != CONTROL_SHA):
        raise ValueError("Frozen manifest and both reference checkpoints required")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = {split: [r for r in manifest["rows"] if r["split"] == split] for split in FEATURE_SHA}
    datasets = {}
    torch.set_num_threads(2)
    for split, views in (("train", 2), ("validation", 1)):
        path = args.features / f"{split}-features.pt"
        if sha256(path) != FEATURE_SHA[split]:
            raise ValueError(f"Frozen feature cache changed: {split}")
        features = checked_features(torch.load(path, weights_only=True), rows[split],
                                    MANIFEST_SHA256, views, "small")
        datasets[split] = (torch.from_numpy(features).float(),
                           torch.tensor(np.repeat([r["label"] for r in rows[split]], views)))
    reference = torch.load(args.reference, weights_only=True, map_location="cpu")
    v, vy = datasets["validation"]
    if (reference["validation_ids"] != [r["id"] for r in rows["validation"]]
            or reference["train_ids"] != [r["id"] for r in rows["train"]]
            or not torch.equal(reference["validation_labels"], vy)):
        raise ValueError("RBF reference identity mismatch")
    recipe = {"manifest_sha256": MANIFEST_SHA256, "features_sha256": FEATURE_SHA,
              "reference_sha256": REFERENCE_SHA, "control_sha256": CONTROL_SHA,
              "code_sha256": {name: sha256(Path(__file__).with_name(name)) for name in
                (Path(__file__).name, "dinov2_model.py", "probe_v4_cross_backbone.py", "v4_metrics.py")},
              "q": Q, "smoothing": .05, "seed": 7042, "classes": GENERA,
              "normalization": "training only", "class_weights": "sqrt(max_count / count)",
              "max_epochs": 200, "min_epochs": 30, "patience": 20, "batch_size": 64,
              "optimizer": {"name": "AdamW", "lr": .001, "weight_decay": .01},
              "scheduler": {"name": "CosineAnnealingLR", "T_max": 200, "eta_min": .00001},
              "torch_version": str(torch.__version__), "threads": 2,
              "split_counts": {k: len(v) for k, v in rows.items()}, "validation_bar": BAR,
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True)
    (args.output / "recipe.json").write_text(json.dumps(recipe, indent=2) + "\n")
    started = time.monotonic()
    results, logits = {}, {"reference": reference["validation_logits"]}
    for name, q in (("control", 0.), ("gce", Q)):
        output = args.output / name
        output.mkdir()
        results[name] = fit_arm(*datasets["train"], v, vy, output, q=q)
        logits[name] = torch.load(output / "head.pt", weights_only=True)["logits"]
        (output / "result.json").write_text(json.dumps(results[name], indent=2) + "\n")
        if name == "control":
            parity = control_parity(logits[name], torch.load(args.control, weights_only=True)["logits"])
            (args.output / "control-parity.json").write_text(json.dumps(parity, indent=2) + "\n")
    populations, excluded = validation_populations(rows["validation"])
    labels = vy.numpy()
    predicted = {name: value.argmax(1).numpy() for name, value in logits.items()}
    reports = {name: {pop: summarize(labels[i], values[i]) for pop, i in populations.items()}
               for name, values in predicted.items()}
    records = [{"id": row["id"], "group": row["group"], "split_group": row.get("split_group", row["group"]),
                "source": row["source"], "label": int(labels[i]),
                "predictions": {name: int(values[i]) for name, values in predicted.items()}}
               for i, row in enumerate(rows["validation"])]
    (args.output / "predictions.json").write_text(json.dumps(records, indent=2) + "\n")
    evaluation = {"recipe_sha256": sha256(args.output / "recipe.json"), "fits": results,
                  "control_parity": parity, "reports": reports, "excluded_conflicting_groups": excluded,
                  "predictions_sha256": sha256(args.output / "predictions.json"),
                  "eligible_for_further_evaluation": eligible(reports["gce"], reports["control"], reports["reference"]),
                  "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False,
                  "seconds": time.monotonic() - started}
    (args.output / "evaluation.json").write_text(json.dumps(evaluation, indent=2, allow_nan=False) + "\n")
    print(json.dumps({"summary": {name: data["raw_all"] for name, data in reports.items()},
                      "eligible": evaluation["eligible_for_further_evaluation"], "seconds": evaluation["seconds"]}), flush=True)


if __name__ == "__main__":
    main()
