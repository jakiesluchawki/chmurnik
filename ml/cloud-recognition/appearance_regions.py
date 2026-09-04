"""Conservative visible-cloud proposals inside a learned sky mask.

Color contrast is a region-selection heuristic, not a cloud classifier. Broad
overcast stays one region. A subsequent classifier assesses every chosen crop.
"""

import numpy as np
from scipy import ndimage


def propose(rgb, sky, limit=4):
    if rgb.shape != (*sky.shape, 3) or not np.isfinite(rgb).all() or not np.isfinite(sky).all():
        raise ValueError("Invalid color or sky-mask grid")
    eligible = sky >= .7
    if eligible.sum() < 32:
        return []
    ratio = rgb[..., 0] / np.maximum(rgb[..., 2], 16)
    base = float(np.quantile(ratio[eligible], .1))
    threshold = min(.86, max(.62, base + .16))
    clouds = eligible if base >= .78 else eligible & (ratio >= threshold)
    clouds = ndimage.binary_closing(clouds, structure=np.ones((3, 3)), border_value=1) & eligible
    labels, count = ndimage.label(clouds, structure=np.ones((3, 3)))
    height, width = sky.shape
    regions = []
    for value in range(1, count + 1):
        ys, xs = np.nonzero(labels == value)
        if len(xs) < max(8, eligible.sum() * .008):
            continue
        left, right, top, bottom = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        if right - left < 4 or bottom - top < 4:
            continue
        raw = left, top, right, bottom
        left, top, right, bottom = max(0, left - 2), max(0, top - 2), min(width, right + 2), min(height, bottom + 2)
        if sky[top:bottom, left:right].mean() < .85:
            left, top, right, bottom = raw
        if sky[top:bottom, left:right].mean() < .85:
            continue
        regions.append({"bounds": [left / width, top / height, (right - left) / width, (bottom - top) / height],
                        "patchCount": int(len(xs))})
    regions.sort(key=lambda row: (-row["patchCount"], row["bounds"][1], row["bounds"][0]))
    return regions[:limit]
