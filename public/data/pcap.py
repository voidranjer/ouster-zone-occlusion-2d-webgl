import json
import numpy as np
from ouster.sdk import open_source
from ouster.sdk.client import LidarScan, ChanField, ScanSource, destagger

pcap_path = "OS-1-128_v3.0.1_1024x10_20230216_142857-000.pcap"
metadata_path = "OS-1-128_v3.0.1_1024x10_20230216_142857.json"

sensor_idx = 0

source: ScanSource = open_source(
    pcap_path, meta=[metadata_path], sensor_idx=sensor_idx, collate=False
)
frame = next(iter(source))
scan: LidarScan = frame[sensor_idx]

range_field = scan.field(ChanField.RANGE)
range_img = destagger(source.sensor_info[sensor_idx], range_field)
payload = range_img[:, 0:227]

import matplotlib.pyplot as plt

plt.imshow(payload, resample=False)
plt.axis("off")
plt.show()

# Export raw range values
payload_list = payload.tolist()
with open("points.json", "w") as outfile:
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
