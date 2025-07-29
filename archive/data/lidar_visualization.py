#!/usr/bin/env python3
"""
LIDAR-style 2D visualization of 3D cylindrical coordinates.
Maps 3D points (x, y, z) to 2D rectangle using cylindrical projection.
"""

import math
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

def read_3d_points(filename):
    """Read 3D points from the output file."""
    points = []
    with open(filename, 'r') as f:
        for line in f:
            coords = line.strip().split()
            x, y, z = float(coords[0]), float(coords[1]), float(coords[2])
            points.append((x, y, z))
    return points

def cylindrical_to_2d_rectangle(points, canvas_width=800, canvas_height=400):
    """
    Convert 3D cylindrical points to 2D rectangle coordinates.
    
    Args:
        points: List of (x, y, z) tuples
        canvas_width: Width of 2D canvas (pixels)
        canvas_height: Height of 2D canvas (pixels)
    
    Returns:
        List of (u, v, distance, height) tuples where:
        - u, v are 2D canvas coordinates
        - distance is cylindrical radius (for coloring)
        - height is z-coordinate (for reference)
    """
    canvas_points = []
    
    # Find min/max values for normalization
    min_z = min(z for x, y, z in points)
    max_z = max(z for x, y, z in points)
    z_range = max_z - min_z
    
    for x, y, z in points:
        # Calculate cylindrical coordinates
        theta = math.atan2(y, x)  # Angle around z-axis (-π to π)
        distance = math.sqrt(x*x + y*y)  # Distance from z-axis
        
        # Map angle to horizontal canvas coordinate (0 to canvas_width)
        # Convert from [-π, π] to [0, 2π] then to [0, canvas_width]
        theta_normalized = (theta + math.pi) / (2 * math.pi)  # [0, 1]
        u = int(theta_normalized * canvas_width)
        u = min(u, canvas_width - 1)  # Clamp to canvas bounds
        
        # Map height to vertical canvas coordinate (0 to canvas_height)
        # Higher z values go toward top of image
        z_normalized = (z - min_z) / z_range if z_range > 0 else 0  # [0, 1]
        v = int((1 - z_normalized) * canvas_height)  # Flip so high z is at top
        v = min(v, canvas_height - 1)  # Clamp to canvas bounds
        
        canvas_points.append((u, v, distance, z))
    
    return canvas_points, (min_z, max_z)

def create_lidar_image(canvas_points, canvas_width=800, canvas_height=400, z_range=None):
    """
    Create a LIDAR-style 2D image from canvas points.
    
    Args:
        canvas_points: List of (u, v, distance, z) tuples
        canvas_width: Width of canvas
        canvas_height: Height of canvas
        z_range: Tuple of (min_z, max_z) for reference
    
    Returns:
        2D numpy array representing the image
    """
    # Create empty canvas
    canvas = np.zeros((canvas_height, canvas_width))
    distance_canvas = np.zeros((canvas_height, canvas_width))
    
    # Fill canvas with points
    for u, v, distance, z in canvas_points:
        # Use distance from z-axis as intensity value
        canvas[v, u] = distance  # v is row (height), u is column (angle)
        distance_canvas[v, u] = distance
    
    return canvas, distance_canvas

def visualize_lidar_data(filename, canvas_width=800, canvas_height=400, save_image=True):
    """
    Complete LIDAR visualization pipeline.
    """
    print("Reading 3D points...")
    points = read_3d_points(filename)
    print(f"Loaded {len(points)} points")
    
    print("Converting to 2D rectangle...")
    canvas_points, z_range = cylindrical_to_2d_rectangle(points, canvas_width, canvas_height)
    
    print("Creating LIDAR image...")
    canvas, distance_canvas = create_lidar_image(canvas_points, canvas_width, canvas_height, z_range)
    
    # Create visualization
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
    
    # Plot 1: LIDAR-style visualization (distance-based coloring)
    im1 = ax1.imshow(canvas, cmap='viridis', aspect='auto', origin='upper')
    ax1.set_title('LIDAR-style 2D Projection (Distance from Z-axis)', fontsize=14)
    ax1.set_xlabel('Angle θ (0° to 360°)')
    ax1.set_ylabel('Height Z')
    
    # Add angle labels
    angle_ticks = np.linspace(0, canvas_width-1, 9)  # 0°, 45°, 90°, ..., 360°
    angle_labels = ['0°', '45°', '90°', '135°', '180°', '225°', '270°', '315°', '360°']
    ax1.set_xticks(angle_ticks)
    ax1.set_xticklabels(angle_labels)
    
    # Add height labels
    height_ticks = np.linspace(0, canvas_height-1, 6)
    height_labels = [f'{z_range[1] - (z_range[1]-z_range[0])*i/5:.1f}' for i in range(6)]
    ax1.set_yticks(height_ticks)
    ax1.set_yticklabels(height_labels)
    
    plt.colorbar(im1, ax=ax1, label='Distance from Z-axis')
    
    # Plot 2: Point density visualization
    # Create a binary version showing point presence
    binary_canvas = (canvas > 0).astype(float)
    im2 = ax2.imshow(binary_canvas, cmap='binary', aspect='auto', origin='upper')
    ax2.set_title('Point Density Visualization', fontsize=14)
    ax2.set_xlabel('Angle θ (0° to 360°)')
    ax2.set_ylabel('Height Z')
    ax2.set_xticks(angle_ticks)
    ax2.set_xticklabels(angle_labels)
    ax2.set_yticks(height_ticks)
    ax2.set_yticklabels(height_labels)
    
    plt.tight_layout()
    
    if save_image:
        plt.savefig('lidar_visualization.png', dpi=150, bbox_inches='tight')
        print("Saved visualization as 'lidar_visualization.png'")
    
    plt.show()
    
    # Print statistics
    print(f"\nStatistics:")
    print(f"  Canvas size: {canvas_width} x {canvas_height}")
    print(f"  Height range: {z_range[0]:.3f} to {z_range[1]:.3f}")
    print(f"  Points plotted: {len([p for p in canvas_points if canvas[p[1], p[0]] > 0])}")
    
    return canvas, canvas_points

def export_2d_coordinates(canvas_points, output_filename='lidar_2d_coords.txt'):
    """
    Export the 2D canvas coordinates to a text file.
    """
    print(f"Exporting 2D coordinates to {output_filename}...")
    with open(output_filename, 'w') as f:
        f.write("# 2D Canvas Coordinates (u, v, distance, original_z)\n")
        f.write("# u: horizontal canvas coordinate (angle)\n")
        f.write("# v: vertical canvas coordinate (height)\n")
        f.write("# distance: cylindrical radius from z-axis\n")
        f.write("# original_z: original z-coordinate\n")
        for u, v, distance, z in canvas_points:
            f.write(f"{u} {v} {distance:.6f} {z:.6f}\n")
    print(f"Exported {len(canvas_points)} 2D coordinates")

if __name__ == "__main__":
    # Main execution
    input_file = "output.txt"
    
    print("=== LIDAR 2D Visualization ===")
    print(f"Input file: {input_file}")
    
    # Create visualization
    canvas, canvas_points = visualize_lidar_data(input_file, canvas_width=800, canvas_height=400)
    
    # Export 2D coordinates
    export_2d_coordinates(canvas_points)
    
    print("Visualization complete!")
