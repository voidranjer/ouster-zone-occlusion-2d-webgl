"""
Binary Protocol Utilities for LiDAR WebSocket Server

This module provides utilities for working with the binary protocol used
by the LiDAR WebSocket server, including format documentation and helper functions.
"""

import struct
import numpy as np
from typing import Dict, Any


# Binary Protocol Documentation
BINARY_PROTOCOL_DOC = """
Binary Protocol Format for LiDAR WebSocket Server
================================================

Header Format (32 bytes, little-endian):
┌─────────────┬──────┬─────────────────────────────────────┐
│    Field    │ Size │              Description            │
├─────────────┼──────┼─────────────────────────────────────┤
│ Magic       │ 4    │ "LIDR" magic bytes                  │
│ Type        │ 4    │ uint32: stream type ID              │
│ Frame       │ 4    │ uint32: frame number                │
│ Shape0      │ 4    │ uint32: first dimension (height/points) │
│ Shape1      │ 4    │ uint32: second dimension (width/channels) │
│ Min         │ 4    │ float32: minimum value in data     │
│ Max         │ 4    │ float32: maximum value in data     │
│ Reserved    │ 4    │ Reserved for future use (0)        │
└─────────────┴──────┴─────────────────────────────────────┘

Stream Type IDs:
• 0 = range2d      - 2D range image (normalized distances)
• 1 = reflectivity2d - 2D reflectivity image (normalized intensity)  
• 2 = points3d     - 3D point coordinates [x, z, -y] in WebGL format
• 3 = reflectivity3d - 3D RGB colors for point cloud

Data Format:
• All numeric data is stored as float32 (4 bytes per value)
• Data immediately follows the 32-byte header
• Data is stored in row-major order for 2D arrays
• Total message size = 32 + (shape0 × max(shape1, 1) × 4) bytes

Examples:
• Range2D (128×1024):    32 + (128 × 1024 × 4) = 524,320 bytes
• Points3D (131,072×3):  32 + (131,072 × 3 × 4) = 1,572,896 bytes
"""


def create_header_struct_format() -> str:
    """Get the struct format string for the binary header."""
    return '<4sIIIIffI'  # Little-endian format


def calculate_message_size(shape0: int, shape1: int = 0) -> int:
    """
    Calculate the total message size for given dimensions.
    
    Args:
        shape0: First dimension (height for 2D, points for 3D)
        shape1: Second dimension (width for 2D, channels for 3D, 0 for 1D)
        
    Returns:
        Total message size in bytes
    """
    header_size = 32
    data_points = shape0 * max(shape1, 1)
    data_size = data_points * 4  # float32 = 4 bytes
    return header_size + data_size


def get_stream_info() -> Dict[str, Dict[str, Any]]:
    """
    Get information about all stream types.
    
    Returns:
        Dictionary with stream type information
    """
    return {
        "range2d": {
            "id": 0,
            "description": "2D range image (normalized distances)",
            "typical_shape": [128, 1024],
            "data_type": "float32",
            "value_range": "[-1.0, 1.0]",
            "units": "normalized (0-200m → -1 to 1)"
        },
        "reflectivity2d": {
            "id": 1, 
            "description": "2D reflectivity image (normalized intensity)",
            "typical_shape": [128, 1024],
            "data_type": "float32", 
            "value_range": "[0.0, 1.0]",
            "units": "normalized (0-255 → 0 to 1, 8x contrast)"
        },
        "points3d": {
            "id": 2,
            "description": "3D point coordinates in WebGL format",
            "typical_shape": [131072, 3],
            "data_type": "float32",
            "value_range": "varies by coordinate",
            "units": "meters [x, z, -y]"
        },
        "reflectivity3d": {
            "id": 3,
            "description": "3D RGB colors for point cloud",
            "typical_shape": [131072, 3], 
            "data_type": "float32",
            "value_range": "[0.0, 1.0]",
            "units": "RGB values [red, green, blue]"
        }
    }


def print_protocol_documentation():
    """Print the complete binary protocol documentation."""
    print(BINARY_PROTOCOL_DOC)
    
    stream_info = get_stream_info()
    print("\nDetailed Stream Information:")
    print("=" * 60)
    
    for stream_type, info in stream_info.items():
        shape = info["typical_shape"]
        size = calculate_message_size(shape[0], shape[1] if len(shape) > 1 else 0)
        size_mb = size / (1024 * 1024)
        
        print(f"\n{stream_type.upper()} (ID: {info['id']})")
        print(f"  Description: {info['description']}")
        print(f"  Typical Shape: {shape}")
        print(f"  Data Type: {info['data_type']}")
        print(f"  Value Range: {info['value_range']}")
        print(f"  Units: {info['units']}")
        print(f"  Message Size: {size:,} bytes ({size_mb:.2f} MB)")


def analyze_message_efficiency():
    """Analyze the efficiency of binary vs JSON format."""
    print("\nEfficiency Analysis: Binary vs JSON")
    print("=" * 50)
    
    # Example: Range2D data (128 x 1024 = 131,072 float values)
    shape = [128, 1024]
    num_values = shape[0] * shape[1]
    
    # Binary format
    binary_size = calculate_message_size(shape[0], shape[1])
    binary_mb = binary_size / (1024 * 1024)
    
    # JSON format (estimated)
    # Each float in JSON: ~8-12 characters on average (including separators)
    # Plus JSON structure overhead
    avg_chars_per_float = 10
    json_structure_overhead = 200  # Rough estimate for JSON keys, brackets, etc.
    json_size = (num_values * avg_chars_per_float) + json_structure_overhead
    json_mb = json_size / (1024 * 1024)
    
    compression_ratio = json_size / binary_size
    space_savings = (1 - binary_size / json_size) * 100
    
    print(f"Example: Range2D data ({shape[0]} × {shape[1]} = {num_values:,} values)")
    print(f"Binary Format:  {binary_size:,} bytes ({binary_mb:.2f} MB)")
    print(f"JSON Format:    {json_size:,} bytes ({json_mb:.2f} MB) [estimated]")
    print(f"Compression:    {compression_ratio:.1f}x smaller with binary")
    print(f"Space Savings:  {space_savings:.1f}%")
    
    print(f"\nBandwidth Requirements (10 FPS):")
    print(f"Binary:  {binary_mb * 10:.2f} MB/s")
    print(f"JSON:    {json_mb * 10:.2f} MB/s")


def create_test_message(stream_type: str, frame_number: int, test_data: np.ndarray) -> bytes:
    """
    Create a test binary message for development/testing.
    
    Args:
        stream_type: Stream type name
        frame_number: Frame number 
        test_data: Test data array
        
    Returns:
        Binary message bytes
    """
    stream_type_ids = {
        "range2d": 0,
        "reflectivity2d": 1,
        "points3d": 2, 
        "reflectivity3d": 3
    }
    
    if stream_type not in stream_type_ids:
        raise ValueError(f"Unknown stream type: {stream_type}")
    
    # Ensure data is float32
    data_f32 = test_data.astype(np.float32)
    
    # Get statistics
    min_val = float(np.min(data_f32))
    max_val = float(np.max(data_f32))
    
    # Get shape info
    shape = data_f32.shape
    shape0 = shape[0] if len(shape) > 0 else 0
    shape1 = shape[1] if len(shape) > 1 else 0
    
    # Create header
    header = struct.pack(
        '<4sIIIIffI',
        b"LIDR",                          # Magic
        stream_type_ids[stream_type],     # Type
        frame_number,                     # Frame
        shape0,                           # Shape0
        shape1,                           # Shape1
        min_val,                          # Min
        max_val,                          # Max
        0                                 # Reserved
    )
    
    # Combine header and data
    return header + data_f32.tobytes()


def validate_message_format(message: bytes) -> Dict[str, Any]:
    """
    Validate a binary message format and return analysis.
    
    Args:
        message: Binary message to validate
        
    Returns:
        Dictionary with validation results
    """
    result = {
        "valid": False,
        "errors": [],
        "warnings": [],
        "info": {}
    }
    
    # Check minimum size
    if len(message) < 32:
        result["errors"].append("Message too short for header")
        return result
    
    try:
        # Parse header
        header = struct.unpack('<4sIIIIffI', message[:32])
        magic, stream_type_id, frame_number, shape0, shape1, min_val, max_val, reserved = header
        
        # Validate magic bytes
        if magic != b"LIDR":
            result["errors"].append(f"Invalid magic bytes: {magic}")
        
        # Validate stream type
        stream_types = {0: "range2d", 1: "reflectivity2d", 2: "points3d", 3: "reflectivity3d"}
        if stream_type_id not in stream_types:
            result["errors"].append(f"Unknown stream type ID: {stream_type_id}")
        
        # Calculate expected size
        expected_data_size = shape0 * max(shape1, 1) * 4
        expected_total_size = 32 + expected_data_size
        actual_size = len(message)
        
        if actual_size != expected_total_size:
            result["errors"].append(
                f"Size mismatch: expected {expected_total_size}, got {actual_size}"
            )
        
        # Check reserved field
        if reserved != 0:
            result["warnings"].append(f"Reserved field not zero: {reserved}")
        
        # Store info
        result["info"] = {
            "magic": magic,
            "stream_type_id": stream_type_id,
            "stream_type": stream_types.get(stream_type_id, "unknown"),
            "frame_number": frame_number,
            "shape": [shape0, shape1] if shape1 > 0 else [shape0],
            "min_val": min_val,
            "max_val": max_val,
            "reserved": reserved,
            "message_size": actual_size,
            "data_size": actual_size - 32,
            "expected_data_points": shape0 * max(shape1, 1)
        }
        
        # Mark as valid if no errors
        result["valid"] = len(result["errors"]) == 0
        
    except Exception as e:
        result["errors"].append(f"Error parsing header: {e}")
    
    return result


if __name__ == "__main__":
    print("LiDAR Binary Protocol Utilities")
    print("=" * 40)
    
    print_protocol_documentation()
    analyze_message_efficiency()
    
    print("\n" + "=" * 60)
    print("Test Message Creation Example:")
    
    # Create a test message
    test_data = np.random.rand(128, 1024).astype(np.float32)
    test_message = create_test_message("range2d", 42, test_data)
    
    print(f"Created test message: {len(test_message)} bytes")
    
    # Validate the test message
    validation = validate_message_format(test_message)
    print(f"Validation result: {'VALID' if validation['valid'] else 'INVALID'}")
    
    if validation['info']:
        info = validation['info']
        print(f"Stream type: {info['stream_type']} (ID: {info['stream_type_id']})")
        print(f"Frame number: {info['frame_number']}")
        print(f"Shape: {info['shape']}")
        print(f"Value range: [{info['min_val']:.3f}, {info['max_val']:.3f}]")
