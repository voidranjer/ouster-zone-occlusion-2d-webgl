"""
Example WebSocket client for testing the binary LiDAR streaming server with chunking support.

This client demonstrates how to connect to all four WebSocket streams
simultaneously and receive binary LiDAR data with proper parsing.

Chunking Protocol:
- Large messages are automatically split into chunks by the server
- Each chunk has a "CHUN" magic header with chunk metadata
- After all chunks, an "EOFR" (End Of Frame) message contains original header
- Client reconstructs the full frame from chunks before processing

Binary Protocol:
- Regular messages: "LIDR" magic + 32-byte header + float32 data
- Chunk messages: "CHUN" magic + chunk header + chunk data
- End-of-frame: "EOFR" magic + frame info + original header
"""

import asyncio
import json
import struct
import websockets
import numpy as np
from typing import Dict, Any, Tuple

SERVER_URL = "ws://localhost:8000"

# Binary protocol constants (must match server)
MAGIC_BYTES = b"LIDR"
STREAM_TYPES = {0: "range2d", 1: "reflectivity2d", 2: "points3d", 3: "reflectivity3d"}


def parse_binary_message(message: bytes) -> Dict[str, Any]:
    """
    Parse binary message from the server.

    Args:
        message: Binary message bytes

    Returns:
        Parsed data dictionary

    Raises:
        ValueError: If message format is invalid
    """
    if len(message) < 32:
        raise ValueError("Message too short for header")

    # Parse header (32 bytes)
    header = struct.unpack("<4sIIIIffI", message[:32])

    magic, stream_type_id, frame_number, shape0, shape1, min_val, max_val, reserved = (
        header
    )

    if magic != MAGIC_BYTES:
        raise ValueError(f"Invalid magic bytes: {magic}")

    if stream_type_id not in STREAM_TYPES:
        raise ValueError(f"Unknown stream type: {stream_type_id}")

    stream_type = STREAM_TYPES[stream_type_id]

    # Calculate expected data size
    data_size = shape0 * max(shape1, 1) * 4  # float32 = 4 bytes
    expected_size = 32 + data_size

    if len(message) != expected_size:
        raise ValueError(
            f"Message size mismatch: expected {expected_size}, got {len(message)}"
        )

    # Parse data
    data_bytes = message[32:]
    data_array = np.frombuffer(data_bytes, dtype=np.float32)

    # Reshape based on dimensions
    if shape1 > 0:
        data_array = data_array.reshape((shape0, shape1))
    else:
        data_array = data_array.reshape((shape0,))

    return {
        "type": stream_type,
        "frame_number": frame_number,
        "shape": [shape0, shape1] if shape1 > 0 else [shape0],
        "min_val": min_val,
        "max_val": max_val,
        "data": data_array,
        "data_size_bytes": len(data_bytes),
    }


class BinaryLiDARClient:
    """Client for connecting to binary LiDAR WebSocket streams with chunking support."""

    def __init__(self, server_url: str = SERVER_URL):
        self.server_url = server_url
        self.connections = {}
        self.frame_counts = {
            "range2d": 0,
            "reflectivity2d": 0,
            "points3d": 0,
            "reflectivity3d": 0,
        }
        self.data_received = {
            "range2d": 0,
            "reflectivity2d": 0,
            "points3d": 0,
            "reflectivity3d": 0,
        }
        # Chunking support
        self.chunk_buffers = {
            "range2d": {},
            "reflectivity2d": {},
            "points3d": {},
            "reflectivity3d": {},
        }

    async def connect_to_stream(self, stream_type: str):
        """Connect to a specific stream and handle incoming binary data."""
        url = f"{self.server_url}/ws/{stream_type}"

        try:
            print(f"Connecting to {stream_type} stream at {url}")
            async with websockets.connect(url) as websocket:
                self.connections[stream_type] = websocket

                async for message in websocket:
                    try:
                        if isinstance(message, bytes):
                            # Handle binary message
                            await self.handle_binary_message(stream_type, message)
                        elif isinstance(message, str):
                            # Handle text message (likely error)
                            data = json.loads(message)
                            if "error" in data:
                                print(f"Error from {stream_type}: {data['error']}")
                        else:
                            print(
                                f"Unknown message type from {stream_type}: {type(message)}"
                            )

                    except Exception as e:
                        print(f"Error handling message for {stream_type}: {e}")

        except websockets.exceptions.ConnectionClosed:
            print(f"{stream_type} stream connection closed")
        except Exception as e:
            print(f"Error connecting to {stream_type} stream: {e}")
        finally:
            if stream_type in self.connections:
                del self.connections[stream_type]

    async def handle_binary_message(self, stream_type: str, message: bytes):
        """Handle incoming binary message from a stream with chunking support."""
        try:
            # Check if this is a chunk, end-of-frame, or regular message
            if len(message) >= 32:
                magic = message[:4]

                if magic == b"CHUN":
                    # Handle chunk message
                    await self.handle_chunk_message(stream_type, message)
                elif magic == b"EOFR":
                    # Handle end-of-frame message and reconstruct
                    await self.handle_end_of_frame(stream_type, message)
                elif magic == MAGIC_BYTES:
                    # Handle regular (non-chunked) message
                    await self.handle_regular_message(stream_type, message)
                else:
                    print(f"Unknown message magic: {magic}")
            else:
                print(f"Message too short: {len(message)} bytes")

        except Exception as e:
            print(f"Error handling binary message for {stream_type}: {e}")

    async def handle_chunk_message(self, stream_type: str, message: bytes):
        """Handle a chunk message."""
        # Parse chunk header
        header = struct.unpack("<4sIIIIffI", message[:32])
        (
            magic,
            stream_type_id,
            frame_number,
            chunk_idx,
            total_chunks,
            start_offset,
            end_offset,
            chunk_size,
        ) = header

        # Extract chunk data
        chunk_data = message[32 : 32 + chunk_size]

        # Initialize frame buffer if needed
        if frame_number not in self.chunk_buffers[stream_type]:
            self.chunk_buffers[stream_type][frame_number] = {
                "chunks": {},
                "total_chunks": total_chunks,
                "stream_type_id": stream_type_id,
            }

        # Store chunk
        self.chunk_buffers[stream_type][frame_number]["chunks"][chunk_idx] = chunk_data

        print(
            f"  Received chunk {chunk_idx + 1}/{total_chunks} for {stream_type} frame {frame_number} "
            f"({len(chunk_data)} bytes)"
        )

    async def handle_end_of_frame(self, stream_type: str, message: bytes):
        """Handle end-of-frame message and reconstruct the full frame."""
        # Parse end-of-frame header
        header = struct.unpack("<4sIIIIffI", message[:32])
        magic, stream_type_id, frame_number, total_data_size, total_chunks, _, _, _ = (
            header
        )

        # Get original header
        original_header = message[32:64]

        # Check if we have all chunks
        if frame_number in self.chunk_buffers[stream_type]:
            frame_buffer = self.chunk_buffers[stream_type][frame_number]

            if len(frame_buffer["chunks"]) == total_chunks:
                # Reconstruct data
                reconstructed_data = b""
                for chunk_idx in sorted(frame_buffer["chunks"].keys()):
                    reconstructed_data += frame_buffer["chunks"][chunk_idx]

                # Create complete message
                complete_message = original_header + reconstructed_data

                # Process as regular message
                await self.handle_regular_message(stream_type, complete_message)

                # Clean up
                del self.chunk_buffers[stream_type][frame_number]

                print(
                    f"  -> Reconstructed {stream_type} frame {frame_number} "
                    f"from {total_chunks} chunks ({len(reconstructed_data)} bytes)"
                )
            else:
                print(
                    f"  Missing chunks for {stream_type} frame {frame_number}: "
                    f"got {len(frame_buffer['chunks'])}, expected {total_chunks}"
                )
        else:
            print(f"  No chunk buffer found for {stream_type} frame {frame_number}")

    async def handle_regular_message(self, stream_type: str, message: bytes):
        """Handle a regular (non-chunked) message."""
        parsed_data = parse_binary_message(message)

        self.frame_counts[stream_type] += 1
        self.data_received[stream_type] += parsed_data["data_size_bytes"]

        frame_number = parsed_data["frame_number"]
        shape = parsed_data["shape"]
        min_val = parsed_data["min_val"]
        max_val = parsed_data["max_val"]
        data_size_mb = parsed_data["data_size_bytes"] / (1024 * 1024)

        # Print summary information
        print(
            f"{stream_type.upper()} Frame {frame_number}: "
            f"Shape={shape}, Range=[{min_val:.3f}, {max_val:.3f}], "
            f"Size={data_size_mb:.2f}MB"
        )

        # Example: Save first frame of each stream type to file
        if frame_number == 0:
            filename = f"{stream_type}_frame_0.npy"
            np.save(filename, parsed_data["data"])
            print(f"  -> Saved first frame to {filename}")

    async def connect_all_streams(self):
        """Connect to all four streams simultaneously."""
        print("Starting Binary LiDAR client - connecting to all streams...")
        print("Binary Protocol: 32-byte header + float32 data")
        print("=" * 60)

        # Create tasks for all streams
        tasks = [
            asyncio.create_task(self.connect_to_stream("range2d")),
            asyncio.create_task(self.connect_to_stream("reflectivity2d")),
            asyncio.create_task(self.connect_to_stream("points3d")),
            asyncio.create_task(self.connect_to_stream("reflectivity3d")),
        ]

        # Wait for all streams to complete
        await asyncio.gather(*tasks, return_exceptions=True)

        print("=" * 60)
        print("All streams completed.")
        print(f"Final frame counts: {self.frame_counts}")

        # Calculate total data received
        total_data_mb = sum(self.data_received.values()) / (1024 * 1024)
        print(f"Total data received: {total_data_mb:.2f} MB")

        for stream_type, bytes_received in self.data_received.items():
            mb_received = bytes_received / (1024 * 1024)
            print(f"  {stream_type}: {mb_received:.2f} MB")


def parse_binary_header_only(message: bytes) -> Dict[str, Any]:
    """
    Parse only the header of a binary message (useful for debugging).

    Args:
        message: Binary message bytes (at least 32 bytes)

    Returns:
        Header information dictionary
    """
    if len(message) < 32:
        return {"error": "Message too short"}

    header = struct.unpack("<4sIIIIffI", message[:32])
    magic, stream_type_id, frame_number, shape0, shape1, min_val, max_val, reserved = (
        header
    )

    return {
        "magic": magic,
        "stream_type_id": stream_type_id,
        "stream_type": STREAM_TYPES.get(stream_type_id, "unknown"),
        "frame_number": frame_number,
        "shape0": shape0,
        "shape1": shape1,
        "min_val": min_val,
        "max_val": max_val,
        "reserved": reserved,
        "total_message_size": len(message),
        "data_size": len(message) - 32,
        "expected_data_points": shape0 * max(shape1, 1),
    }


async def main():
    """Main function to run the binary client."""
    client = BinaryLiDARClient()

    try:
        await client.connect_all_streams()
    except KeyboardInterrupt:
        print("\nClient interrupted by user")
    except Exception as e:
        print(f"Client error: {e}")


if __name__ == "__main__":
    print("Binary LiDAR WebSocket Client")
    print("Press Ctrl+C to stop")
    print()

    asyncio.run(main())
