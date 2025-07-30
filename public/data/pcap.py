import json
import numpy as np
from ouster.sdk import open_source
from ouster.sdk.client import LidarScan, ChanField, ScanSource, destagger, XYZLut

pcap_path = "OS-1-128_v3.0.1_1024x10_20230216_142857-000.pcap"
metadata_path = "OS-1-128_v3.0.1_1024x10_20230216_142857.json"

sensor_idx = 0

source: ScanSource = open_source(
    pcap_path, meta=[metadata_path], sensor_idx=sensor_idx, collate=False
)
sensor_info = source.sensor_info[sensor_idx]
frame = next(iter(source))
scan: LidarScan = frame[sensor_idx]

range_field = scan.field(ChanField.RANGE)
range_img = destagger(sensor_info, range_field)
# payload = range_img[:, 0:227]
payload = range_img

# Export raw range values
payload_list = payload.tolist()
with open("pixels.json", "w") as outfile:
    json.dump(payload_list, outfile)

# Compute and print min/max in mm
print("\n=== Point Cloud Statistics ===")
min_mm = np.min(payload)
max_mm = np.max(payload)
print(f"\nMin range (mm): {min_mm}")
print(f"Max range (mm): {max_mm}")

# Convert to meters for convenience
payload_m = payload.astype(np.float32) / 1000.0
print(f"Min range (m): {payload_m.min():.3f}")
print(f"Max range (m): {payload_m.max():.3f}")

# 128 (vertical channels) x 1024 (horizontal steps)
print(f"Shape: {payload.shape}")

# -- viz -- #

# import matplotlib.pyplot as plt

# plt.imshow(payload, resample=False)
# plt.axis("off")
# plt.show()

xyzlut = XYZLut(sensor_info)
xyz = xyzlut(scan)

import numpy as np

[x, y, z] = [c.flatten() for c in np.dsplit(xyz, 3)]

# # Compute distance from origin for each point
# dist = np.sqrt(x**2 + y**2 + z**2)
# # Create mask for points within 100 units
# mask = dist < 10
# # Filter the x, y, z arrays
# x = x[mask]
# y = y[mask]
# z = z[mask]

xyz_webgl = np.stack((x, z, -y), axis=1)

with open("points.json", "w") as outfile:
    json.dump(xyz_webgl.tolist(), outfile)

# ax = plt.axes(projection="3d")
# r = 10
# ax.set_xlim3d([-r, r])
# ax.set_ylim3d([-r, r])
# ax.set_zlim3d([-r / 2, r / 2])
# plt.axis("off")
# z_col = np.minimum(np.absolute(z), 5)
# ax.scatter(x, y, z, c=z_col, s=0.2)
# plt.show()
