"""Predeclared classification gates; passing these is not Apple release approval."""


def confirmatory_gates(candidate, previous):
    clouds = candidate.get("cloud_only", {})
    checks = {
        "fresh_test_top1_plus_5pp": candidate.get("top1_accuracy", 0) >= previous.get("top1_accuracy", 1) + .05,
        "fresh_test_macro_f1_plus_3pp": candidate.get("macro_f1", 0) >= previous.get("macro_f1", 1) + .03,
        "fresh_cloud_precision_at_least_85pct": (clouds.get("selective_precision") or 0) >= .85,
        "fresh_at_least_20_accepted_clouds": clouds.get("accepted_count", 0) >= 20,
    }
    return {"passed": all(checks.values()), "checks": checks}


def classification_gates(reports, baseline):
    test, previous = reports["test"], baseline["test"]
    atlas, old_atlas = reports["diagnostic"], baseline["diagnostic"]
    stress, old_stress = reports["stress"], baseline["stress"]
    clouds, old_clouds = test["cloud_only"], previous["cloud_only"]
    checks = {
        "test_top1_plus_5pp": test["top1_accuracy"] >= previous["top1_accuracy"] + .05,
        "test_macro_f1_plus_3pp": test["macro_f1"] >= previous["macro_f1"] + .03,
        "atlas_regression_at_most_one_image": atlas["top1_accuracy"] >= old_atlas["top1_accuracy"] - 1 / atlas["sample_count"] - 1e-9,
        "stress_regression_at_most_2pp": stress["top1_accuracy"] >= old_stress["top1_accuracy"] - .02,
        "accepted_precision_at_least_85pct": (test["selective_precision"] or 0) >= .85,
        "at_least_20_accepted": test["accepted_count"] >= 20,
        "coverage_regression_at_most_3pp": test["selective_coverage"] >= previous["selective_coverage"] - .03,
        "cloud_only_top1_plus_5pp": clouds["top1_accuracy"] >= old_clouds["top1_accuracy"] + .05,
        "cloud_only_accepted_precision_at_least_85pct": (clouds["selective_precision"] or 0) >= .85,
        "at_least_20_accepted_clouds": clouds["accepted_count"] >= 20,
    }
    return {"passed": all(checks.values()), "checks": checks,
            "remaining": "Review outlier/quality behavior, Core ML and native parity, latency/memory, and product regression before shipping"}
