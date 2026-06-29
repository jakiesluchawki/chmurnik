"""WMO SYNOP-to-genus label mapping used by CHMURNIK."""

from __future__ import annotations

import numpy as np


GENERA = [
    "cirrus",
    "cirrocumulus",
    "cirrostratus",
    "altocumulus",
    "altostratus",
    "nimbostratus",
    "stratocumulus",
    "stratus",
    "cumulus",
    "cumulonimbus",
    "clear_sky",
]

# Columns 0-9 are CL0-9, 10-19 are CM0-9, and 20-29 are CH0-9.
# Combined SYNOP codes activate every genus that is valid for that code.
SYNOP_TO_GENERA = {
    1: (8,),
    2: (8,),
    3: (9,),
    4: (6,),
    5: (6,),
    6: (7,),
    7: (7, 8),
    8: (6, 8),
    9: (9,),
    11: (4,),
    12: (4, 5),
    13: (3,),
    14: (3,),
    15: (3,),
    16: (3,),
    17: (3,),
    18: (3,),
    19: (3,),
    21: (0,),
    22: (0,),
    23: (0,),
    24: (0,),
    25: (0, 2),
    26: (0, 2),
    27: (2,),
    28: (2,),
    29: (1,),
}


def to_genus_labels(synop_labels: np.ndarray) -> np.ndarray:
    """Convert 30 WMO SYNOP outputs to ten genera plus clear sky."""

    labels = np.zeros((len(synop_labels), len(GENERA)), dtype=np.float32)
    for synop_index, genus_indices in SYNOP_TO_GENERA.items():
        for genus_index in genus_indices:
            labels[:, genus_index] = np.maximum(
                labels[:, genus_index], synop_labels[:, synop_index]
            )
    labels[:, -1] = (labels[:, :-1].sum(axis=1) == 0).astype(np.float32)
    return labels
