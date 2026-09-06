"""Measure one synthetic source per fresh macOS runner, without loading ML."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

from verify import digest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if sys.platform != "darwin":
        raise ValueError("This receipt uses macOS ru_maxrss byte units")
    args.output.mkdir(parents=True, exist_ok=False)
    results = []
    for run, limit in enumerate([1800, 4096] * 3):
        output = args.output / f"run{run}-limit{limit}.png"
        manifest = args.output / f"run{run}.json"
        manifest.write_text(json.dumps([dict(input=str(args.source.resolve()), output=str(output.resolve()), maximumSide=limit)]) + "\n")
        with (args.output / f"run{run}.log").open("w") as log:
            child = subprocess.Popen([str(args.binary.resolve()), "--images", str(manifest.resolve())], stdout=log, stderr=log)
            _, status, usage = os.wait4(child.pid, 0)
            child.returncode = os.waitstatus_to_exitcode(status)
        if child.returncode != 0:
            raise RuntimeError(f"Native memory run {run} failed: {child.returncode}")
        results.append(dict(run=run, maximumSide=limit, returncode=child.returncode, peak_rss_bytes=usage.ru_maxrss,
                            user_seconds=usage.ru_utime, system_seconds=usage.ru_stime,
                            output_sha256=digest(output)))
    result = dict(scope="Fresh macOS command-line processes for one synthetic RGB source; no ML or app loaded",
                  source_sha256=digest(args.source), binary_sha256=digest(args.binary), verifier_sha256=digest(__file__), rows=results)
    (args.output / "report.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
