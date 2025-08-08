"""
FastAPI WebSocket Server for Real-time LiDAR Data Streaming

This server provides five WebSocket endpoints for streaming different representations
of LiDAR data from Ouster sensor PCAP files:
1. Range2D - 2D range image data
2. Reflectivity2D - 2D reflectivity image data
3. Points3D - 3D point cloud coordinates
4. Reflectivity3D - 3D point cloud with reflectivity colors
5. Combined2D - Combined 3D coordinates + reflectivity in flat array format

Each stream processes the entire PCAP file sequentially, sending binary data frame by frame
until the iterator is exhausted, then closes the connection.

Binary Protocol Format:
- Header: 32 bytes
  - Magic: 4 bytes ("LIDR")
  - Type: 4 bytes (uint32: 0=range2d, 1=reflectivity2d, 2=points3d, 3=reflectivity3d, 4=combined2d)
  - Frame: 4 bytes (uint32: frame number)
  - Shape0: 4 bytes (uint32: first dimension)
  - Shape1: 4 bytes (uint32: second dimension, 0 if not applicable)
  - Min: 4 bytes (float32: minimum value)
  - Max: 4 bytes (float32: maximum value)
  - Reserved: 4 bytes (for future use)
- Data: Variable length float32 array
"""

import asyncio
import json
import logging
import struct
from typing import Dict, Any, Optional, Tuple

import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ouster.sdk import open_source
from ouster.sdk.client import LidarScan, ChanField, ScanSource, destagger, XYZLut

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
PCAP_PATH = "OS-1-128_v3.0.1_1024x10_20230216_142857-000.pcap"
METADATA_PATH = "OS-1-128_v3.0.1_1024x10_20230216_142857.json"
SENSOR_IDX = 0
FPS = 10  # Frames per second for all streams

app = FastAPI(
    title="LiDAR WebSocket Streaming Server",
    description="Real-time streaming of LiDAR data via WebSocket connections",
    version="1.0.0",
)

# Enable CORS for frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Binary protocol constants
MAGIC_BYTES = b"LIDR"
STREAM_TYPES = {
    "range2d": 0,
    "reflectivity2d": 1,
    "points3d": 2,
    "reflectivity3d": 3,
    "combined2d": 4,
}


def create_binary_message(
    stream_type: str, frame_number: int, data: np.ndarray
) -> bytes:
    """
    Create a binary message with header and data.

    Args:
        stream_type: Type of stream
        frame_number: Frame number
        data: NumPy array of float32 data

    Returns:
        Binary message bytes
    """
    # Ensure data is float32
    data_f32 = data.astype(np.float32)

    # Calculate statistics
    min_val = float(np.min(data_f32))
    max_val = float(np.max(data_f32))

    # Get shape info
    shape = data_f32.shape
    shape0 = shape[0] if len(shape) > 0 else 0
    shape1 = shape[1] if len(shape) > 1 else 0

    # Create header (32 bytes total)
    header = struct.pack(
        "<4sIIIIffI",  # Little-endian format
        MAGIC_BYTES,  # Magic: 4 bytes
        STREAM_TYPES[stream_type],  # Type: 4 bytes (uint32)
        frame_number,  # Frame: 4 bytes (uint32)
        shape0,  # Shape0: 4 bytes (uint32)
        shape1,  # Shape1: 4 bytes (uint32)
        min_val,  # Min: 4 bytes (float32)
        max_val,  # Max: 4 bytes (float32)
        0,  # Reserved: 4 bytes
    )

    # Convert data to bytes
    data_bytes = data_f32.tobytes()

    return header + data_bytes


class LiDARProcessor:
    """Handles LiDAR data processing and normalization."""

    def __init__(self, pcap_path: str, metadata_path: str, sensor_idx: int = 0):
        """
        Initialize the LiDAR processor.

        Args:
            pcap_path: Path to the PCAP file
            metadata_path: Path to the metadata JSON file
            sensor_idx: Index of the sensor to process
        """
        self.pcap_path = pcap_path
        self.metadata_path = metadata_path
        self.sensor_idx = sensor_idx
        self._source = None
        self._sensor_info = None
        self._xyzlut = None

    def _initialize_source(self) -> None:
        """Initialize the scan source and sensor info."""
        if self._source is None:
            logger.info(f"Opening LiDAR source: {self.pcap_path}")
            self._source = open_source(
                self.pcap_path,
                meta=[self.metadata_path],
                sensor_idx=self.sensor_idx,
                collate=False,
                index=False,
            )
            self._sensor_info = self._source.sensor_info[self.sensor_idx]
            self._xyzlut = XYZLut(self._sensor_info)

    def get_frame_iterator(self):
        """Get an iterator over all frames in the PCAP file."""
        self._initialize_source()
        return iter(self._source)

    def process_range_2d(self, scan: LidarScan, frame_number: int) -> bytes:
        """
        Process range data into 2D image format and return binary message.

        Args:
            scan: LiDAR scan data
            frame_number: Frame number for header

        Returns:
            Binary message bytes
        """
        range_field = scan.field(ChanField.RANGE)
        range_img = destagger(self._sensor_info, range_field)

        # Normalize range data (0-200m to -1 to 1)
        normalized = self._normalize_2d(
            range_img,
            source_min=0,
            source_max=200_000,  # 200 meters for OS-1-128
            target_min=-1,
            target_max=1,
        )

        return create_binary_message("range2d", frame_number, normalized)

    def process_reflectivity_2d(self, scan: LidarScan, frame_number: int) -> bytes:
        """
        Process reflectivity data into 2D image format and return binary message.

        Args:
            scan: LiDAR scan data
            frame_number: Frame number for header

        Returns:
            Binary message bytes
        """
        reflectivity_field = scan.field(ChanField.REFLECTIVITY)
        reflectivity_img = destagger(self._sensor_info, reflectivity_field)

        # Normalize reflectivity data (0-255 to 0-1 with contrast boost)
        normalized = self._normalize_2d(
            reflectivity_img,
            source_min=0,
            source_max=255,
            target_min=0,
            target_max=1,
            contrast_factor=8,
        )

        return create_binary_message("reflectivity2d", frame_number, normalized)

    def process_points_3d(self, scan: LidarScan, frame_number: int) -> bytes:
        """
        Process scan data into 3D point cloud coordinates and return binary message.

        Args:
            scan: LiDAR scan data
            frame_number: Frame number for header

        Returns:
            Binary message bytes
        """
        xyz = self._xyzlut(scan)
        x, y, z = [c.flatten() for c in np.dsplit(xyz, 3)]

        # Convert to WebGL coordinate system (x, z, -y)
        xyz_webgl = np.stack((x, z, -y), axis=1)

        return create_binary_message("points3d", frame_number, xyz_webgl)

    def process_reflectivity_3d(self, scan: LidarScan, frame_number: int) -> bytes:
        """
        Process scan data into 3D point cloud with reflectivity colors and return binary message.

        Args:
            scan: LiDAR scan data
            frame_number: Frame number for header

        Returns:
            Binary message bytes
        """
        # Get reflectivity data
        reflectivity_field = scan.field(ChanField.REFLECTIVITY)
        reflectivity_img = destagger(self._sensor_info, reflectivity_field)

        # Normalize reflectivity
        reflectivity_normalized = self._normalize_2d(
            reflectivity_img,
            source_min=0,
            source_max=255,
            target_min=0,
            target_max=1,
            contrast_factor=8,
        )

        # Flatten and create RGB colors
        reflectivity_1d = reflectivity_normalized.flatten()
        reflectivity_rgb = np.stack(
            (
                reflectivity_1d,
                1 - np.ones_like(reflectivity_1d),  # Inverse green channel
                np.ones_like(reflectivity_1d),  # Full blue channel
            ),
            axis=1,
        )

        return create_binary_message("reflectivity3d", frame_number, reflectivity_rgb)

    def process_combined_2d(self, scan: LidarScan, frame_number: int) -> bytes:
        """
        Process scan data into combined 3D coordinates + reflectivity format and return binary message.
        Creates WebGL clip space coordinates (-1 to 1) from the 2D grid structure.
        Creates a flat 1D array with format: [x1, y1, z1, reflectivity1, x2, y2, z2, reflectivity2, ...]

        Args:
            scan: LiDAR scan data
            frame_number: Frame number for header

        Returns:
            Binary message bytes
        """
        # Get range data for Z coordinates
        range_field = scan.field(ChanField.RANGE)
        range_img = destagger(self._sensor_info, range_field)

        # Get reflectivity data using the same logic as process_reflectivity_2d
        reflectivity_field = scan.field(ChanField.REFLECTIVITY)
        reflectivity_img = destagger(self._sensor_info, reflectivity_field)

        # Normalize reflectivity data (0-255 to 0-1 with contrast boost) - same as process_reflectivity_2d
        reflectivity_normalized = self._normalize_2d(
            reflectivity_img,
            source_min=0,
            source_max=255,
            target_min=0,
            target_max=1,
            contrast_factor=8,
        )

        # Create WebGL clip space coordinates from 2D grid structure
        # Expected shape should match reflectivity_2d: 128x1024
        height, width = reflectivity_normalized.shape  # Should be (128, 1024)

        # Create X coordinates from columns: map 0->width-1 to -1->1
        x_coords = np.linspace(-1, 1, width)
        x_grid = np.tile(x_coords, (height, 1))  # Broadcast to full grid

        # Create Y coordinates from rows: map 0->height-1 to -1->1
        y_coords = np.linspace(1, -1, height)
        y_grid = np.tile(y_coords.reshape(-1, 1), (1, width))  # Broadcast to full grid

        # Create Z coordinates from range measurements: normalize range to -1->1
        z_grid = self._normalize_2d(
            range_img,
            source_min=0,
            source_max=200_000,  # 200 meters for OS-1-128
            target_min=-1,
            target_max=1,
        )

        # Flatten all arrays to 1D
        x_flat = x_grid.flatten()
        y_flat = y_grid.flatten()
        z_flat = z_grid.flatten()
        reflectivity_flat = reflectivity_normalized.flatten()

        # Combine into flat array: [x1, y1, z1, reflectivity1, x2, y2, z2, reflectivity2, ...]
        # Create an interleaved array with shape (N*4,) where N is number of points
        n_points = len(x_flat)
        combined = np.zeros(n_points * 4, dtype=np.float32)

        # Fill the combined array with interleaved data
        combined[0::4] = x_flat  # x coordinates at indices 0, 4, 8, ...
        combined[1::4] = y_flat  # y coordinates at indices 1, 5, 9, ...
        combined[2::4] = z_flat  # z coordinates at indices 2, 6, 10, ...
        combined[3::4] = reflectivity_flat  # reflectivity at indices 3, 7, 11, ...

        return create_binary_message("combined2d", frame_number, combined)

    def _normalize_2d(
        self,
        payload: np.ndarray,
        source_min: float,
        source_max: float,
        target_min: float,
        target_max: float,
        contrast_factor: float = 1.0,
    ) -> np.ndarray:
        """
        Normalize 2D array from source range to target range.

        Args:
            payload: Input data array
            source_min: Minimum value of source range
            source_max: Maximum value of source range
            target_min: Minimum value of target range
            target_max: Maximum value of target range
            contrast_factor: Multiplication factor for contrast enhancement

        Returns:
            Normalized array
        """
        # Linear interpolation
        source_range = source_max - source_min
        target_range = target_max - target_min
        normalized = target_min + (payload - source_min) * target_range / source_range

        # Apply contrast factor and clamp
        normalized = np.minimum(normalized * contrast_factor, np.ones_like(normalized))

        return normalized


# Global processor instance
processor = LiDARProcessor(PCAP_PATH, METADATA_PATH, SENSOR_IDX)


async def stream_data(
    websocket: WebSocket, stream_type: str, max_message_size: int = 512 * 1024
):  # 512KB default
    """
    Generic streaming function for all data types with message size handling.

    Args:
        websocket: WebSocket connection
        stream_type: Type of stream ('range2d', 'reflectivity2d', 'points3d', 'reflectivity3d', 'combined2d')
        max_message_size: Maximum size for a single WebSocket message in bytes
    """
    logger.info(
        f"Starting {stream_type} stream with max message size {max_message_size} bytes"
    )

    try:
        frame_count = 0
        frame_iterator = processor.get_frame_iterator()

        for frame in frame_iterator:
            scan: LidarScan = frame[SENSOR_IDX]

            # Process based on stream type and get binary data
            if stream_type == "range2d":
                binary_data = processor.process_range_2d(scan, frame_count)
            elif stream_type == "reflectivity2d":
                binary_data = processor.process_reflectivity_2d(scan, frame_count)
            elif stream_type == "points3d":
                binary_data = processor.process_points_3d(scan, frame_count)
            elif stream_type == "reflectivity3d":
                binary_data = processor.process_reflectivity_3d(scan, frame_count)
            elif stream_type == "combined2d":
                binary_data = processor.process_combined_2d(scan, frame_count)
            else:
                raise ValueError(f"Unknown stream type: {stream_type}")

            # Check if message needs chunking
            if len(binary_data) > max_message_size:
                await send_chunked_data(
                    websocket, binary_data, frame_count, stream_type
                )
            else:
                await websocket.send_bytes(binary_data)

            frame_count += 1

            # Frame rate control based on FPS constant
            frame_delay = 1.0 / FPS  # Calculate delay from FPS
            await asyncio.sleep(frame_delay)

        logger.info(f"Finished streaming {frame_count} frames for {stream_type}")

    except Exception as e:
        logger.error(f"Error in {stream_type} stream: {e}")
        # Send error as JSON text message for compatibility
        await websocket.send_text(json.dumps({"error": str(e), "type": "error"}))

    finally:
        try:
            await websocket.close()
        except:
            pass  # Connection might already be closed


async def send_chunked_data(
    websocket: WebSocket, binary_data: bytes, frame_number: int, stream_type: str
):
    """
    Send large binary data in chunks with chunk headers.

    Args:
        websocket: WebSocket connection
        binary_data: Large binary message to chunk
        frame_number: Original frame number
        stream_type: Type of stream
    """
    header_size = 32
    data_size = len(binary_data) - header_size
    original_header = binary_data[:header_size]
    data_part = binary_data[header_size:]

    # Calculate chunk size (leave room for chunk header)
    chunk_data_size = 256 * 1024  # 256KB per chunk
    total_chunks = (
        data_size + chunk_data_size - 1
    ) // chunk_data_size  # Ceiling division

    logger.info(
        f"Chunking {stream_type} frame {frame_number}: {len(binary_data)} bytes -> {total_chunks} chunks"
    )

    # Send chunks
    for chunk_idx in range(total_chunks):
        start_idx = chunk_idx * chunk_data_size
        end_idx = min(start_idx + chunk_data_size, data_size)
        chunk_data = data_part[start_idx:end_idx]

        # Create chunk header (32 bytes)
        # Reuse original format but modify type to indicate chunking
        chunk_header = struct.pack(
            "<4sIIIIffI",  # Little-endian format
            b"CHUN",  # Magic: 4 bytes (changed for chunks)
            STREAM_TYPES[stream_type],  # Type: 4 bytes (uint32) - original type
            frame_number,  # Frame: 4 bytes (uint32)
            chunk_idx,  # Shape0: 4 bytes (chunk index)
            total_chunks,  # Shape1: 4 bytes (total chunks)
            float(start_idx),  # Min: 4 bytes (start offset)
            float(end_idx),  # Max: 4 bytes (end offset)
            len(chunk_data),  # Reserved: 4 bytes (chunk data size)
        )

        # Send chunk
        chunk_message = chunk_header + chunk_data
        await websocket.send_bytes(chunk_message)

        # Small delay between chunks
        await asyncio.sleep(0.001)  # 1ms delay

    # Send end-of-frame marker with original header for reconstruction
    end_marker = (
        struct.pack(
            "<4sIIIIffI",
            b"EOFR",  # Magic: 4 bytes (End Of Frame)
            STREAM_TYPES[stream_type],  # Type: 4 bytes (uint32)
            frame_number,  # Frame: 4 bytes (uint32)
            data_size,  # Shape0: 4 bytes (total data size)
            total_chunks,  # Shape1: 4 bytes (total chunks sent)
            0.0,  # Min: 4 bytes (unused)
            0.0,  # Max: 4 bytes (unused)
            0,  # Reserved: 4 bytes (unused)
        )
        + original_header
    )  # Include original header for reconstruction

    await websocket.send_bytes(end_marker)


@app.websocket("/ws/range2d")
async def websocket_range2d(websocket: WebSocket):
    """WebSocket endpoint for 2D range image data stream."""
    await websocket.accept()
    logger.info("Range2D WebSocket connected")

    try:
        await stream_data(websocket, "range2d")
    except WebSocketDisconnect:
        logger.info("Range2D WebSocket disconnected")
    except Exception as e:
        logger.error(f"Range2D WebSocket error: {e}")


@app.websocket("/ws/reflectivity2d")
async def websocket_reflectivity2d(websocket: WebSocket):
    """WebSocket endpoint for 2D reflectivity image data stream."""
    await websocket.accept()
    logger.info("Reflectivity2D WebSocket connected")

    try:
        await stream_data(websocket, "reflectivity2d")
    except WebSocketDisconnect:
        logger.info("Reflectivity2D WebSocket disconnected")
    except Exception as e:
        logger.error(f"Reflectivity2D WebSocket error: {e}")


@app.websocket("/ws/points3d")
async def websocket_points3d(websocket: WebSocket):
    """WebSocket endpoint for 3D point cloud coordinates stream."""
    await websocket.accept()
    logger.info("Points3D WebSocket connected")

    try:
        await stream_data(websocket, "points3d")
    except WebSocketDisconnect:
        logger.info("Points3D WebSocket disconnected")
    except Exception as e:
        logger.error(f"Points3D WebSocket error: {e}")


@app.websocket("/ws/reflectivity3d")
async def websocket_reflectivity3d(websocket: WebSocket):
    """WebSocket endpoint for 3D point cloud with reflectivity colors stream."""
    await websocket.accept()
    logger.info("Reflectivity3D WebSocket connected")

    try:
        await stream_data(websocket, "reflectivity3d")
    except WebSocketDisconnect:
        logger.info("Reflectivity3D WebSocket disconnected")
    except Exception as e:
        logger.error(f"Reflectivity3D WebSocket error: {e}")


@app.websocket("/ws/combined2d")
async def websocket_combined2d(websocket: WebSocket):
    """WebSocket endpoint for combined 3D coordinates + reflectivity stream."""
    await websocket.accept()
    logger.info("Combined2D WebSocket connected")

    try:
        await stream_data(websocket, "combined2d")
    except WebSocketDisconnect:
        logger.info("Combined2D WebSocket disconnected")
    except Exception as e:
        logger.error(f"Combined2D WebSocket error: {e}")


@app.get("/")
async def root():
    """Root endpoint with server information."""
    return {
        "service": "LiDAR WebSocket Streaming Server",
        "version": "1.0.0",
        "endpoints": {
            "range2d": "/ws/range2d",
            "reflectivity2d": "/ws/reflectivity2d",
            "points3d": "/ws/points3d",
            "reflectivity3d": "/ws/reflectivity3d",
            "combined2d": "/ws/combined2d",
        },
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    logger.info("Starting LiDAR WebSocket Streaming Server")
    uvicorn.run(
        "lidar_websocket_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
