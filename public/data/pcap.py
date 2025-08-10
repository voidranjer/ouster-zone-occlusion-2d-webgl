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

    # Export to JSON
    normalized_list = normalized.tolist()
    with open(f"{name}.json", "w") as outfile:
        json.dump(normalized_list, outfile)

    return normalized


pcap_path = "OS-1-128_v3.0.1_1024x10_20230216_142857-000.pcap"
metadata_path = "OS-1-128_v3.0.1_1024x10_20230216_142857.json"
# pcap_path = "kanata.pcap"
# metadata_path = "kanata.json"

sensor_idx = 0
frame_number = 2

source: ScanSource = open_source(
    pcap_path, meta=[metadata_path], sensor_idx=sensor_idx, collate=False, index=True
)
sensor_info = source.sensor_info[sensor_idx]
frame = source[frame_number]
# frame = next(iter(source))
scan: LidarScan = frame[sensor_idx]

range_field = scan.field(ChanField.RANGE)
range_img = destagger(sensor_info, range_field)
parse2D(range_img, "range_2d", 0, 200_000, -1, 1)  # 200 meters for OS-1-128

reflectivity_field = scan.field(ChanField.REFLECTIVITY)
# reflectivity_field = scan.field(ChanField.NEAR_IR)
reflectivity_img = destagger(sensor_info, reflectivity_field)
# reflectivity_normalized = parse2D(reflectivity_img, "reflectivity", 0, 65535, 0, 1)
reflectivity_normalized = parse2D(reflectivity_img, "reflectivity_2d", 0, 255, 0, 1, 8)

# -- viz -- #

# import matplotlib.pyplot as plt

# plt.imshow(payload, resample=False)
# plt.axis("off")
# plt.show()

xyzlut = XYZLut(sensor_info)
xyz = xyzlut(scan)

[x, y, z] = [c.flatten() for c in np.dsplit(xyz, 3)]

# # Compute distance from origin for each point
# dist = np.sqrt(x**2 + y**2 + z**2)
# # Create mask for points within 100 units
# mask = dist < 10
# # Filter the x, y, z arrays
# x = x[mask]
# y = y[mask]
# z = z[mask]

# Range
xyz_webgl = np.stack((x, z, -y), axis=1)
with open("points_3d.json", "w") as outfile:
    json.dump(xyz_webgl.tolist(), outfile)

# Reflectivity
reflectivity_1d = reflectivity_normalized.flatten()
reflectivity_webgl_rgb = np.stack(
    (
        reflectivity_1d,
        1 - np.ones_like(reflectivity_1d),
        np.ones_like(reflectivity_1d),
    ),
    axis=1,
)
with open("reflectivity_3d.json", "w") as outfile:
    json.dump(reflectivity_webgl_rgb.tolist(), outfile)

# --- Stats --- #

print("\n=== Point Cloud Statistics ===")
print(f"X: [{np.min(x)}, {np.max(x)}]")
print(f"Y: [{np.min(y)}, {np.max(y)}]")
print(f"Z: [{np.min(z)}, {np.max(z)}]")
print("-----")
print(f"Points shape: {xyz_webgl.shape}")
print(f"Reflectivity shape: {reflectivity_webgl_rgb.shape}")

# ax = plt.axes(projection="3d")
# r = 10
# ax.set_xlim3d([-r, r])
# ax.set_ylim3d([-r, r])
# ax.set_zlim3d([-r / 2, r / 2])
# plt.axis("off")
# z_col = np.minimum(np.absolute(z), 5)
# ax.scatter(x, y, z, c=z_col, s=0.2)
# plt.show()
