#!/usr/bin/env python3
"""
Generate 5000 random 3D coordinates scattered away from the z-axis.
No points should be within 1 unit radius from the z-axis (cylindrical exclusion zone).
Maximum distance from z-axis is 2 units (forms a cylindrical shape).
Z coordinates range from 0 (ground level) to 1 units height.
Output is saved to output.txt with one sample per line.
"""

import random
import math


def generate_random_3d_point_in_cylinder(
    min_cylinder_radius=1.0, max_cylinder_radius=2.0, min_z=0.0, max_z=1.0
):
    """
    Generate a random 3D point within a cylindrical shape, outside the inner exclusion cylinder.

    Args:
        min_cylinder_radius: Minimum distance from z-axis (default: 1.0)
        max_cylinder_radius: Maximum distance from z-axis (default: 2.0)
        min_z: Minimum z-coordinate (ground level, default: 0.0)
        max_z: Maximum z-coordinate (height limit, default: 1.0)

    Returns:
        tuple: (x, y, z) coordinates
    """
    # Generate random angle
    angle = random.uniform(0, 2 * math.pi)

    # Generate radius with uniform distribution in area
    # For uniform distribution in area: r = sqrt(uniform(min_r^2, max_r^2))
    min_r_squared = min_cylinder_radius**2
    max_r_squared = max_cylinder_radius**2
    r_squared = random.uniform(min_r_squared, max_r_squared)
    xy_radius = math.sqrt(r_squared)

    # Convert to Cartesian coordinates
    x = xy_radius * math.cos(angle)
    y = xy_radius * math.sin(angle)

    # Generate random z coordinate
    z = random.uniform(min_z, max_z)

    return x, y, z


def main():
    """Generate 5000 random 3D coordinates and save to output.txt"""
    num_samples = 100000
    output_file = "output.txt"

    print(f"Generating {num_samples} random 3D coordinates...")
    print(f"Minimum distance from z-axis (cylindrical): 1.0 unit")
    print(f"Maximum distance from z-axis (cylindrical): 2.0 units")
    print(f"Z-coordinate range: 0.0 (ground) to 1.0 units (height)")

    # Generate random points
    points = []
    for i in range(num_samples):
        point = generate_random_3d_point_in_cylinder(min_z=-1.0)
        points.append(point)

        # Progress indicator
        if (i + 1) % 1000 == 0:
            print(f"Generated {i + 1}/{num_samples} points...")

    # Write to output file
    print(f"Writing coordinates to {output_file}...")
    with open(output_file, "w") as f:
        for x, y, z in points:
            f.write(f"{x:.6f} {y:.6f} {z:.6f}\n")

    print(f"Successfully generated {num_samples} 3D coordinates!")
    print(f"Output saved to: {output_file}")

    # Verify constraints
    min_distance_3d = min(math.sqrt(x * x + y * y + z * z) for x, y, z in points)
    max_distance_3d = max(math.sqrt(x * x + y * y + z * z) for x, y, z in points)
    min_cylinder_distance = min(math.sqrt(x * x + y * y) for x, y, z in points)
    max_cylinder_distance = max(math.sqrt(x * x + y * y) for x, y, z in points)
    min_z = min(z for x, y, z in points)
    max_z = max(z for x, y, z in points)

    print(f"Verification:")
    print(f"  Minimum 3D distance from origin: {min_distance_3d:.6f}")
    print(f"  Maximum 3D distance from origin: {max_distance_3d:.6f}")
    print(f"  Minimum cylindrical distance from z-axis: {min_cylinder_distance:.6f}")
    print(f"  Maximum cylindrical distance from z-axis: {max_cylinder_distance:.6f}")
    print(f"  All points outside 1-unit cylinder: {min_cylinder_distance >= 1.0}")
    print(f"  All points within 2-unit cylinder: {max_cylinder_distance <= 2.0}")
    print(f"  Minimum Z-coordinate: {min_z:.6f}")
    print(f"  Maximum Z-coordinate: {max_z:.6f}")
    print(f"  Z within range [0, 1]: {0.0 <= min_z and max_z <= 1.0}")


if __name__ == "__main__":
    main()
