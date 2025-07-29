from ouster.sdk import open_source
import numpy as np

pcap_path = "OS-1-128_v3.0.1_1024x10_20230216_142857-000.pcap"
metadata_path = "OS-1-128_v3.0.1_1024x10_20230216_142857.json"


def compute_xyz_from_range(lidar_scan):
    """Convert range data to XYZ coordinates manually"""
    sensor_info = lidar_scan.sensor_info

    # Get range data
    range_data = lidar_scan.field("RANGE")
    h, w = range_data.shape

    # Get beam angles and azimuth angles
    beam_azimuth_angles = sensor_info.beam_azimuth_angles
    beam_altitude_angles = sensor_info.beam_altitude_angles

    # Create coordinate arrays
    xyz = np.zeros((h, w, 3), dtype=np.float32)

    for row in range(h):
        for col in range(w):
            range_val = range_data[row, col]

            if range_val == 0:  # Invalid measurement
                continue

            # Convert range to meters (Ouster uses mm internally)
            range_m = range_val / 1000.0

            # Get angles for this beam
            azimuth = beam_azimuth_angles[col] if col < len(beam_azimuth_angles) else 0
            altitude = (
                beam_altitude_angles[row] if row < len(beam_altitude_angles) else 0
            )

            # Convert to radians
            azimuth_rad = np.deg2rad(azimuth)
            altitude_rad = np.deg2rad(altitude)

            # Convert spherical to cartesian coordinates
            # Note: Ouster uses a specific coordinate system
            x = range_m * np.cos(altitude_rad) * np.cos(azimuth_rad)
            y = range_m * np.cos(altitude_rad) * np.sin(azimuth_rad)
            z = range_m * np.sin(altitude_rad)

            xyz[row, col] = [x, y, z]

    return xyz


# Open the source with the PCAP and metadata files
source = open_source(pcap_path, meta=[metadata_path], sensor_idx=0, collate=False)

# Get the first frame only
counter = 0
for scan in source.single(0):
    counter += 1
    if counter < 5:
        continue

    # Get the first scan from the frame
    lidar_scan = scan[0]

    try:
        # Convert to XYZ coordinates
        xyz = compute_xyz_from_range(lidar_scan)

        # Reshape to get individual points (N x 3 array where N is number of points)
        points = xyz.reshape(-1, 3)

        # Filter out invalid points (where all coordinates are 0)
        valid_points = points[~np.all(points == 0, axis=1)]

        # Write coordinates to output.txt
        with open("output.txt", "w") as f:
            for point in valid_points:
                f.write(f"{point[0]:.6f} {point[1]:.6f} {point[2]:.6f}\n")

        print(f"Written {len(valid_points)} 3D coordinates to output.txt")

    except Exception as e:
        print(f"Error: {e}")
        print("Let's examine the sensor info structure:")
        sensor_info = lidar_scan.sensor_info
        print(
            "Sensor info attributes:",
            [attr for attr in dir(sensor_info) if not attr.startswith("_")],
        )

    break  # Only process the first frame
