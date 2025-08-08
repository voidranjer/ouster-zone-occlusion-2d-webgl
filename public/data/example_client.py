"""
Example WebSocket client for testing the LiDAR streaming server.

This client demonstrates how to connect to all four WebSocket streams
simultaneously and receive real-time LiDAR data.
"""

import asyncio
import json
import websockets
from typing import Dict, Any

SERVER_URL = "ws://localhost:8000"

class LiDARClient:
    """Client for connecting to LiDAR WebSocket streams."""
    
    def __init__(self, server_url: str = SERVER_URL):
        self.server_url = server_url
        self.connections = {}
        self.frame_counts = {
            "range2d": 0,
            "reflectivity2d": 0,
            "points3d": 0,
            "reflectivity3d": 0
        }
    
    async def connect_to_stream(self, stream_type: str):
        """Connect to a specific stream and handle incoming data."""
        url = f"{self.server_url}/ws/{stream_type}"
        
        try:
            print(f"Connecting to {stream_type} stream at {url}")
            async with websockets.connect(url) as websocket:
                self.connections[stream_type] = websocket
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.handle_message(stream_type, data)
                    except json.JSONDecodeError as e:
                        print(f"Error decoding JSON for {stream_type}: {e}")
                    except Exception as e:
                        print(f"Error handling message for {stream_type}: {e}")
                        
        except websockets.exceptions.ConnectionClosed:
            print(f"{stream_type} stream connection closed")
        except Exception as e:
            print(f"Error connecting to {stream_type} stream: {e}")
        finally:
            if stream_type in self.connections:
                del self.connections[stream_type]
    
    async def handle_message(self, stream_type: str, data: Dict[str, Any]):
        """Handle incoming message from a stream."""
        if "error" in data:
            print(f"Error from {stream_type}: {data['error']}")
            return
        
        self.frame_counts[stream_type] += 1
        frame_number = data.get("frame_number", self.frame_counts[stream_type])
        
        # Print summary information (avoid printing large data arrays)
        if stream_type in ["range2d", "reflectivity2d"]:
            shape = data.get("shape", [])
            min_val = data.get("min_val", 0)
            max_val = data.get("max_val", 0)
            print(f"{stream_type.upper()} Frame {frame_number}: "
                  f"Shape={shape}, Range=[{min_val:.3f}, {max_val:.3f}]")
        
        elif stream_type == "points3d":
            shape = data.get("shape", [])
            bounds = data.get("bounds", {})
            print(f"{stream_type.upper()} Frame {frame_number}: "
                  f"Points={shape[0] if shape else 0}, "
                  f"X=[{bounds.get('x', [0,0])[0]:.1f}, {bounds.get('x', [0,0])[1]:.1f}], "
                  f"Y=[{bounds.get('y', [0,0])[0]:.1f}, {bounds.get('y', [0,0])[1]:.1f}], "
                  f"Z=[{bounds.get('z', [0,0])[0]:.1f}, {bounds.get('z', [0,0])[1]:.1f}]")
        
        elif stream_type == "reflectivity3d":
            shape = data.get("shape", [])
            print(f"{stream_type.upper()} Frame {frame_number}: "
                  f"Points={shape[0] if shape else 0}, "
                  f"Channels={shape[1] if len(shape) > 1 else 0}")
        
        # You can add custom processing logic here
        # For example, save to files, render to screen, etc.
    
    async def connect_all_streams(self):
        """Connect to all four streams simultaneously."""
        print("Starting LiDAR client - connecting to all streams...")
        
        # Create tasks for all streams
        tasks = [
            asyncio.create_task(self.connect_to_stream("range2d")),
            asyncio.create_task(self.connect_to_stream("reflectivity2d")),
            asyncio.create_task(self.connect_to_stream("points3d")),
            asyncio.create_task(self.connect_to_stream("reflectivity3d"))
        ]
        
        # Wait for all streams to complete
        await asyncio.gather(*tasks, return_exceptions=True)
        
        print("All streams completed.")
        print(f"Final frame counts: {self.frame_counts}")

async def main():
    """Main function to run the client."""
    client = LiDARClient()
    
    try:
        await client.connect_all_streams()
    except KeyboardInterrupt:
        print("\nClient interrupted by user")
    except Exception as e:
        print(f"Client error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
