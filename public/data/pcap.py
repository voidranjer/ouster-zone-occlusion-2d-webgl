import json
import numpy as np
from ouster.sdk import open_source
from ouster.sdk.client import LidarScan, ChanField, ScanSource, destagger, XYZLut


def parse2D(
    payload: np.ndarray,
    name: str,
    source_min: float,
    source_max: float,
    target_min: float,
    target_max: float,
    contrast_factor=1,
    flatten_output=False,
):
    # Compute and print min/max
    print(f"\n=== 2D Statistics ({name}) ===")

    # Source
    min_val = np.min(payload)
    max_val = np.max(payload)
    print(f"Min ({source_min}): {min_val}")
    print(f"Max ({source_max}): {max_val}")

    # Linear Interpolation
    source_range = source_max - source_min
    target_range = target_max - target_min
    normalized = target_min + (payload - source_min) * target_range / source_range

    # Brighten
    normalized = np.minimum(normalized * contrast_factor, np.ones_like(normalized))

    # Normalized
    min_val = np.min(normalized)
    max_val = np.max(normalized)
    print("-----")
    print(f"Min ({target_min}): {min_val}")
    print(f"Max ({target_max}): {max_val}")

    # E.g.,: 128 (vertical channels) x 1024 (horizontal steps)
    print("-----")
    print(f"Shape: {normalized.shape}")

    # Flatten if requested
    if flatten_output:
        normalized = normalized.flatten()
        print(f"Flattened shape: {normalized.shape}")

    # Export to JSON
    normalized_list = normalized.tolist()
    with open(f"{name}.json", "w") as outfile:
        json.dump(normalized_list, outfile)

    return normalized


pcap_path = "OS-1-128_v3.0.1_1024x10_20230216_142857-000.pcap"
metadata_path = "OS-1-128_v3.0.1_1024x10_20230216_142857.json"

sensor_idx = 0
# frame_number = 4

source: ScanSource = open_source(
    pcap_path, meta=[metadata_path], sensor_idx=sensor_idx, collate=False, index=True
)
sensor_info = source.sensor_info[sensor_idx]
# frame = source[frame_number]
frame = next(iter(source))
scan: LidarScan = frame[sensor_idx]
source.close()

range_field = scan.field(ChanField.RANGE)
range_img = destagger(sensor_info, range_field)
parse2D(range_img, "range", 0, 200_000, -1, 1, 1, True)  # 200 meters for OS-1-128

reflectivity_field = scan.field(ChanField.REFLECTIVITY)
# reflectivity_field = scan.field(ChanField.NEAR_IR)
reflectivity_img = destagger(sensor_info, reflectivity_field)
# reflectivity_normalized = parse2D(reflectivity_img, "reflectivity", 0, 65535, 0, 1)
reflectivity_normalized = parse2D(reflectivity_img, "reflectivity", 0, 255, 0, 1, 8, True)

xyzlut = XYZLut(sensor_info)
xyz = destagger(sensor_info, xyzlut(scan))

[x, y, z] = [c.flatten() for c in np.dsplit(xyz, 3)]

# Range
xyz_webgl = np.stack((x, z, -y), axis=1)
xyz_webgl_flat = xyz_webgl.flatten()
with open("points.json", "w") as outfile:
    json.dump(xyz_webgl_flat.tolist(), outfile)

# Reflectivity
reflectivity_webgl_rgb = np.stack(
    (
        reflectivity_normalized,
        1 - np.ones_like(reflectivity_normalized),
        np.ones_like(reflectivity_normalized),
    ),
    axis=1,
)
with open("reflectivity_rgb.json", "w") as outfile:
    json.dump(reflectivity_webgl_rgb.tolist(), outfile)

# --- Stats --- #

print("\n=== Point Cloud Statistics ===")
print(f"X: [{np.min(x)}, {np.max(x)}]")
print(f"Y: [{np.min(y)}, {np.max(y)}]")
print(f"Z: [{np.min(z)}, {np.max(z)}]")
print("-----")
print(f"Points shape: {xyz_webgl.shape}")
print(f"Reflectivity shape: {reflectivity_webgl_rgb.shape}")
