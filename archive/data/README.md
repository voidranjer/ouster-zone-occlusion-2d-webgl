# Ouster Lidar Point Cloud Processing

This directory contains scripts for processing and visualizing Ouster lidar PCAP files.

## Files

- `run.py` - Extracts 3D coordinates from Ouster PCAP files (first frame only)
- `visualize_point_cloud.py` - Interactive matplotlib visualization of point cloud data
- `output.txt` - Generated point cloud coordinates (X Y Z per line, in meters)

## Usage

### 1. Extract Point Cloud Coordinates

```bash
python run.py
```

This reads the Ouster PCAP file and generates `output.txt` with 3D coordinates from the first frame.

**Input files required:**
- `OS-1-128_v3.0.1_1024x10_20230216_142857-000.pcap` (PCAP file)
- `OS-1-128_v3.0.1_1024x10_20230216_142857.json` (metadata file)

**Output:**
- `output.txt` - Text file with X Y Z coordinates (one point per line, in meters)

### 2. Visualize Point Cloud

```bash
# Interactive visualization (default)
python visualize_point_cloud.py

# With options
python visualize_point_cloud.py --color distance --size 1.0 --subsample 5

# Save to file instead of showing
python visualize_point_cloud.py --save my_plot.png --max-range 50

# Show help for all options
python visualize_point_cloud.py --help
```

**Visualization Options:**
- `--color {height,distance,intensity,uniform}` - Coloring scheme
- `--size SIZE` - Point size (default: 0.5)
- `--max-range METERS` - Limit display to points within range
- `--subsample N` - Show every Nth point (reduces density)
- `--save FILENAME` - Save plot instead of showing interactively
- `--no-stats` - Skip printing statistics

**Color Modes:**
- `height` - Color by Z coordinate (height)
- `distance` - Color by distance from origin
- `intensity` - Color by Z value capped at 5m
- `uniform` - Single color (blue)

## Data Format

The `output.txt` file contains:
- **Units**: Meters
- **Format**: X Y Z coordinates, space-separated
- **Coordinate System**: Sensor coordinate frame
  - X-axis: Forward from sensor
  - Y-axis: Left/right
  - Z-axis: Up/down

## Example Data Statistics

From the sample data:
- **123,347 points** from first frame
- **X range**: 3.665 to 194.284 meters
- **Y range**: -9.810 to 9.848 meters  
- **Z range**: -12.977 to 25.819 meters
- **Max detection range**: ~196 meters

## Interactive Controls (Visualization)

When showing the interactive plot:
- **Left click + drag**: Rotate view
- **Right click + drag**: Pan view
- **Scroll wheel**: Zoom in/out
- **Close window** or **Ctrl+C**: Exit

## Performance Tips

For large point clouds (>50k points):
- Use `--subsample N` to reduce point density
- Use `--max-range METERS` to limit the display range
- Save to file with `--save` instead of interactive display

## Dependencies

- `numpy` - Array operations
- `matplotlib` - 3D visualization
- `ouster-sdk` - Lidar data processing

Install with:
```bash
pip install numpy matplotlib ouster-sdk
```
