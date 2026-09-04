import argparse
import hashlib
import json
from pathlib import Path
import tempfile
from types import MethodType

import coremltools as ct
import torch

from labels import GENERA
from model import build_model
from v4_gate import classification_gates, confirmatory_gates


def classification_export_evidence(checkpoint, checkpoint_path, research_only=False):
    if checkpoint.get("pipeline_version") != 4:
        return {}
    if research_only:
        return {"classification_approval": "research-only; not approved for release"}
    path = checkpoint_path.parent / "evaluation.json"
    if not path.is_file():
        raise ValueError("V4 export requires a paired evaluation; use --research-only for a conversion experiment")
    evaluation = json.loads(path.read_text())
    if (evaluation.get("manifest_sha256") != checkpoint["manifest_sha256"]
            or evaluation.get("calibrated_checkpoint_sha256") != hashlib.sha256(checkpoint_path.read_bytes()).hexdigest()):
        raise ValueError("Evaluation is not bound to this calibrated checkpoint and manifest")
    if (not evaluation.get("holdouts_evaluated") or not evaluation.get("confirmatory_evaluated")
            or not checkpoint.get("abstention_policy", {}).get("target_met")):
        raise ValueError("Classification evaluation/calibration is incomplete or failed")
    if checkpoint.get("confirmatory_set_exposed") or evaluation.get("confirmatory_evidence") == "previously_exposed_regression":
        raise ValueError("Previously exposed regression data cannot establish fresh confirmation")
    reports, baseline = evaluation["reports"], evaluation["baseline_reports"]
    if (not classification_gates(reports, baseline)["passed"]
            or not confirmatory_gates(reports["confirmatory"], baseline["confirmatory"])["passed"]):
        raise ValueError("Classification gates failed; conversion cannot approve this model")
    return {"classification_approval": "passed; native parity and product verification still required",
            "classification_evaluation_sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def data_attribution(checkpoint, manifest_path):
    license_text = "Training data: CCSN CC0 1.0; clear-sky tensor supplement MIT."
    sources = ["https://doi.org/10.7910/DVN/CADDPD", "https://huggingface.co/datasets/jcamier/cloud_sky_vis"]
    if checkpoint.get("pipeline_version") == 4:
        if manifest_path is None:
            raise ValueError("V4 export requires its frozen manifest for data attribution")
        data = manifest_path.read_bytes()
        if hashlib.sha256(data).hexdigest() != checkpoint["manifest_sha256"]:
            raise ValueError("Export manifest mismatch")
        manifest = json.loads(data)
        if manifest["classes"] != GENERA:
            raise ValueError("Export class order mismatch")
        used = {row["source"] for row in manifest["rows"] if row["split"] in {"train", "validation", "calibration"}}
        if used - {"ccsn", "clear", "imgw-2024-samples"}:
            raise ValueError(f"Missing data attribution for {sorted(used)}")
        if "imgw-2024-samples" in used:
            provenance = manifest["imgw_provenance"]
            if provenance["license"] != "CC-BY-4.0":
                raise ValueError("Unexpected IMGW license")
            license_text += f" IMGW CC BY 4.0, {provenance['authors']}, DOI {provenance['doi']}; {provenance['transform']}."
            sources.append(provenance["source"])
    return license_text, sources


class CalibratedModel(torch.nn.Module):
    def __init__(self, model, temperature: float) -> None:
        super().__init__()
        self.model = model
        self.temperature = temperature

    def forward(self, image):
        return torch.softmax(self.model(image) / self.temperature, dim=1)


@torch.inference_mode()
def freeze_position_encoding(model, input_size):
    """Precompute only fixed-size DINO positions; Core ML lacks bicubic resize."""
    backbone = model.backbone
    patch_size = backbone.patch_embed.patch_size[0]
    tokens = torch.zeros(1, (input_size // patch_size) ** 2 + 1, backbone.embed_dim)
    positions = backbone.interpolate_pos_encoding(tokens, input_size, input_size).detach().clone()
    generator = torch.Generator().manual_seed(7042)
    examples = torch.rand(3, 3, input_size, input_size, generator=generator)
    expected = model(examples)
    backbone.register_buffer("export_positions", positions)

    def fixed_positions(self, tokens, width, height):
        return self.export_positions.to(dtype=tokens.dtype)

    backbone.interpolate_pos_encoding = MethodType(fixed_positions, backbone)
    torch.testing.assert_close(model(examples), expected, atol=1e-6, rtol=1e-6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--precision", choices=["float16", "float32"], default="float16")
    parser.add_argument("--research-only", action="store_true")
    args = parser.parse_args()
    if args.output.exists() or args.output.is_symlink():
        raise ValueError("Preserve the existing model; choose a new output path")
    if args.output.suffix != ".mlpackage":
        raise ValueError("Output must be a .mlpackage")
    checkpoint_path = args.artifacts / "cloud-genus-net.pt"
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    license_text, data_sources = data_attribution(checkpoint, args.manifest)
    approval = classification_export_evidence(checkpoint, checkpoint_path, args.research_only)
    torch.set_num_threads(2)
    model = build_model(
        len(GENERA),
        architecture=checkpoint.get("architecture", "mobilenet_v3_small"),
        model_config=checkpoint.get("model_config"),
    )
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    input_size = int(checkpoint.get("input_size", 224))
    if checkpoint.get("architecture", "").startswith("dinov2_"):
        freeze_position_encoding(model, input_size)
    calibrated = CalibratedModel(model, float(checkpoint["temperature"])).eval()
    example = torch.zeros(1, 3, input_size, input_size)
    traced = (torch.export.export(calibrated, (example,)).run_decompositions({})
              if checkpoint.get("architecture", "").startswith("dinov2_")
              else torch.jit.trace(calibrated, example))
    converted = ct.convert(
        traced,
        convert_to="mlprogram",
        inputs=[ct.ImageType(name="image", shape=example.shape, scale=1 / 255.0, color_layout=ct.colorlayout.RGB)],
        outputs=[ct.TensorType(name="probabilities")],
        minimum_deployment_target=ct.target.iOS15,
        compute_precision=ct.precision.FLOAT16 if args.precision == "float16" else ct.precision.FLOAT32,
        skip_model_load=True,
    )
    converted.author = "CHMURNIK / Mieszko Mahboob"
    converted.license = license_text
    if checkpoint.get("architecture", "").startswith("dinov2_"):
        converted.license += " DINOv2 backbone: Meta AI, Apache-2.0."
    converted.short_description = "On-device WMO cloud-family and genus hypothesis model."
    converted.version = f"{checkpoint.get('pipeline_version', 2)}.0" + ("-research" if args.research_only else "")
    metadata = converted.user_defined_metadata
    metadata.update(approval)
    metadata["classes"] = json.dumps(GENERA)
    metadata["minimum_confidence"] = str(checkpoint["abstention_policy"]["minimum_confidence"])
    metadata["abstention_margin_threshold"] = str(checkpoint["abstention_policy"]["margin_threshold"])
    metadata["abstention_target_precision"] = str(checkpoint["abstention_policy"]["target_precision"])
    metadata["training_data_doi"] = "10.7910/DVN/CADDPD"
    metadata["training_data_sources"] = json.dumps(data_sources)
    metadata["export_precision"] = args.precision
    metadata["probability_mode"] = "softmax"
    metadata["architecture"] = checkpoint.get("architecture", "mobilenet_v3_small")
    metadata["input_size"] = str(input_size)
    metadata["preprocess"] = checkpoint.get("preprocess", "center_crop")
    if checkpoint.get("pipeline_version") == 4:
        metadata["manifest_sha256"] = checkpoint["manifest_sha256"]
        metadata["crop_fraction"] = str(checkpoint["crop_fraction"])
        metadata["validation_epoch"] = str(checkpoint["epoch"])
        metadata["calibration_temperature"] = str(checkpoint["temperature"])
        if checkpoint.get("architecture", "").startswith("dinov2_"):
            from dinov2_model import DINOV2_REVISION
            if checkpoint.get("backbone_revision", DINOV2_REVISION) != DINOV2_REVISION:
                raise ValueError("Checkpoint backbone revision mismatch")
            metadata["backbone_revision"] = DINOV2_REVISION
            metadata["backbone_license"] = "Apache-2.0"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".coreml-export-", dir=args.output.parent) as temporary:
        staged = Path(temporary) / args.output.name
        converted.save(str(staged))
        if args.output.exists() or args.output.is_symlink():
            raise ValueError("Output appeared during conversion; refusing to replace it")
        staged.rename(args.output)
    print(args.output)


if __name__ == "__main__":
    main()
