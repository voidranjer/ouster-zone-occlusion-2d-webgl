# LiDAR Binary WebSocket Streaming Server

A high-performance FastAPI-based WebSocket server for real-time streaming of LiDAR data from Ouster sensor PCAP files. This server provides five different binary data streams optimized for maximum throughput and minimal latency.

## Features

- **Five Binary WebSocket Streams:**
  - `Range2D` - 2D range image data (normalized distance values)
  - `Reflectivity2D` - 2D reflectivity image data (normalized intensity values)
  - `Points3D` - 3D point cloud coordinates in WebGL format
  - `Reflectivity3D` - 3D point cloud with reflectivity color mapping
  - `Combined2D` - Combined 3D coordinates + reflectivity in flat array format

- **Binary Protocol:** Efficient 32-byte header + float32 data format
- **High Performance:** ~2.5x more efficient than JSON encoding
- **Real-time Streaming:** Processes entire PCAP files frame by frame
- **Auto-close:** Connections automatically close when data stream is exhausted
- **CORS Support:** Configured for frontend integration
- **Comprehensive Logging:** Detailed logging for monitoring and debugging

## Binary Protocol Format

The server uses a custom binary protocol for maximum efficiency with automatic chunking support for large messages:

### Standard Message Format (32 bytes, little-endian):
```
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
```

### Chunking Protocol for Large Messages

When messages exceed the configured size limit (default: 512KB), they are automatically split into chunks:

**Chunk Message Format:**
```
┌─────────────┬──────┬─────────────────────────────────────┐
│    Field    │ Size │              Description            │
├─────────────┼──────┼─────────────────────────────────────┤
│ Magic       │ 4    │ "CHUN" magic bytes                  │
│ Type        │ 4    │ uint32: original stream type ID    │
│ Frame       │ 4    │ uint32: frame number                │
│ ChunkIdx    │ 4    │ uint32: chunk index (0-based)      │
│ TotalChunks │ 4    │ uint32: total number of chunks     │
│ StartOffset │ 4    │ float32: chunk start offset        │
│ EndOffset   │ 4    │ float32: chunk end offset          │
│ ChunkSize   │ 4    │ uint32: size of chunk data         │
└─────────────┴──────┴─────────────────────────────────────┘
+ Chunk Data (variable length)
```

**End-of-Frame Message Format:**
```
┌─────────────┬──────┬─────────────────────────────────────┐
│    Field    │ Size │              Description            │
├─────────────┼──────┼─────────────────────────────────────┤
│ Magic       │ 4    │ "EOFR" magic bytes                  │
│ Type        │ 4    │ uint32: original stream type ID    │
│ Frame       │ 4    │ uint32: frame number                │
│ DataSize    │ 4    │ uint32: total data size             │
│ TotalChunks │ 4    │ uint32: total chunks sent          │
│ Unused      │ 12   │ Reserved fields (unused)            │
└─────────────┴──────┴─────────────────────────────────────┘
+ Original Header (32 bytes) - for frame reconstruction
```

### Stream Type IDs:
• 0 = range2d      - 2D range image (normalized distances)
• 1 = reflectivity2d - 2D reflectivity image (normalized intensity)  
• 2 = points3d     - 3D point coordinates [x, z, -y] in WebGL format
• 3 = reflectivity3d - 3D RGB colors for point cloud
• 4 = combined2D   - Flat array [x1, y1, z1, reflectivity1, x2, y2, z2, reflectivity2, ...]

### Data Format:
• All numeric data is stored as float32 (4 bytes per value)
• Data immediately follows the 32-byte header
• Data is stored in row-major order for 2D arrays
• **Small messages:** Single "LIDR" message
• **Large messages:** Multiple "CHUN" messages + "EOFR" end marker
• **Chunk size:** 256KB per chunk (configurable)

### Message Flow for Large Frames:
1. Server detects message > size limit
2. Splits data into 256KB chunks
3. Sends chunk messages with "CHUN" magic
4. Sends end-of-frame with "EOFR" magic + original header
5. Client reconstructs original frame from chunks

### Efficiency Comparison

- **Range2D (128×1024):** 524KB binary vs ~1.3MB JSON (2.5x savings)
- **Points3D (131K×3):** 1.57MB binary vs ~3.9MB JSON (2.5x savings)
- **Bandwidth at 10 FPS:** Binary: ~5MB/s vs JSON: ~12.5MB/s

## Installation

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Prepare Data Files:**
   - Ensure your PCAP file and metadata JSON are in the same directory
   - Update the file paths in `lidar_websocket_server.py` if needed:
     ```python
     PCAP_PATH = "your_file.pcap"
     METADATA_PATH = "your_file.json"
     ```

## Usage

### Starting the Server

```bash
python lidar_websocket_server.py
```

The server will start on `http://localhost:8000` by default.

### API Endpoints

#### WebSocket Streams
- `ws://localhost:8000/ws/range2d` - 2D range image stream
- `ws://localhost:8000/ws/reflectivity2d` - 2D reflectivity image stream
- `ws://localhost:8000/ws/points3d` - 3D point cloud coordinates stream
- `ws://localhost:8000/ws/reflectivity3d` - 3D reflectivity colors stream
- `ws://localhost:8000/ws/combined2d` - Combined 3D coordinates + reflectivity stream

#### HTTP Endpoints
- `GET /` - Server information and available endpoints
- `GET /health` - Health check endpoint

## Binary Client Examples

### Python Client

A complete binary client example is provided in `binary_client.py`:

```bash
python binary_client.py
```

### Testing Chunking Implementation

Test the chunking functionality with the provided test script:

```bash
python test_chunking.py
```

This script will:
- Start the WebSocket server automatically
- Run the binary client to test Points3D stream
- Verify that chunking works correctly for large messages
- Display chunking statistics and performance metrics
- Clean up server process when complete

**Expected Output for Successful Chunking:**
```
✅ CHUNKING TEST PASSED!
   - Large messages were successfully split into chunks
   - Client successfully reconstructed frames from chunks

Chunking points3d frame 0: 1572896 bytes -> 6 chunks
  Received chunk 1/6 for points3d frame 0 (262144 bytes)
  Received chunk 2/6 for points3d frame 0 (262144 bytes)
  ...
  -> Reconstructed points3d frame 0 from 6 chunks (1572864 bytes)
```

### JavaScript/Frontend Integration

```javascript
// Binary protocol parsing
function parseBinaryMessage(buffer) {
    const view = new DataView(buffer);
    
    // Parse header (32 bytes, little-endian)
    const magic = new TextDecoder().decode(new Uint8Array(buffer, 0, 4));
    const streamTypeId = view.getUint32(4, true);
    const frameNumber = view.getUint32(8, true);
    const shape0 = view.getUint32(12, true);
    const shape1 = view.getUint32(16, true);
    const minVal = view.getFloat32(20, true);
    const maxVal = view.getFloat32(24, true);
    const reserved = view.getUint32(28, true);
    
    // Validate magic bytes
    if (magic !== 'LIDR') {
        throw new Error('Invalid magic bytes');
    }
    
    // Parse data (float32 array starting at byte 32)
    const dataPoints = shape0 * Math.max(shape1, 1);
    const data = new Float32Array(buffer, 32, dataPoints);
    
    return {
        streamType: ['range2d', 'reflectivity2d', 'points3d', 'reflectivity3d'][streamTypeId],
        frameNumber,
        shape: shape1 > 0 ? [shape0, shape1] : [shape0],
        minVal,
        maxVal,
        data: data
    };
}

// Connect to binary streams
const streams = ['range2d', 'reflectivity2d', 'points3d', 'reflectivity3d'];

streams.forEach(streamType => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${streamType}`);
    ws.binaryType = 'arraybuffer'; // Important: set binary type
    
    ws.onopen = () => {
        console.log(`${streamType} binary stream connected`);
    };
    
    ws.onmessage = (event) => {
        try {
            if (event.data instanceof ArrayBuffer) {
                // Handle binary message
                const parsed = parseBinaryMessage(event.data);
                handleStreamData(parsed);
            } else {
                // Handle text message (likely error)
                const error = JSON.parse(event.data);
                console.error(`${streamType} error:`, error.error);
            }
        } catch (error) {
            console.error(`Error parsing ${streamType} message:`, error);
        }
    };
    
    ws.onclose = () => {
        console.log(`${streamType} binary stream closed`);
    };
});

function handleStreamData(data) {
    console.log(`${data.streamType.toUpperCase()} Frame ${data.frameNumber}: 
                Shape=${JSON.stringify(data.shape)}, 
                Range=[${data.minVal.toFixed(3)}, ${data.maxVal.toFixed(3)}]`);
    
    // Process the data based on stream type
    switch(data.streamType) {
        case 'range2d':
            // data.data is Float32Array, reshape to 2D if needed
            updateRangeVisualization(data);
            break;
        case 'reflectivity2d':
            updateReflectivityVisualization(data);
            break;
        case 'points3d':
            // data.data contains [x, z, -y] coordinates
            updatePointCloud(data);
            break;
        case 'reflectivity3d':
            // data.data contains [r, g, b] values
            updatePointCloudColors(data);
            break;
    }
}
```

## Binary Data Processing

### Parsing Binary Messages

Use the provided utilities in `binary_protocol_utils.py`:

```python
from binary_protocol_utils import parse_binary_message, validate_message_format

# Validate and parse a binary message
validation = validate_message_format(message_bytes)
if validation['valid']:
    data = parse_binary_message(message_bytes)
    print(f"Received {data['type']} frame {data['frame_number']}")
    # data['data'] contains the numpy array
else:
    print("Invalid message:", validation['errors'])
```

### Working with Binary Data

```python
import numpy as np

# Example: Process range2d data
def process_range2d(parsed_data):
    data_array = parsed_data['data']  # numpy.ndarray, shape (128, 1024)
    
    # Convert to image format (0-255)
    normalized = ((data_array + 1.0) / 2.0 * 255).astype(np.uint8)
    
    # Save as image
    from PIL import Image
    img = Image.fromarray(normalized, mode='L')
    img.save('range_image.png')

# Example: Process points3d data  
def process_points3d(parsed_data):
    points = parsed_data['data']  # numpy.ndarray, shape (131072, 3)
    
    # Points are in [x, z, -y] WebGL format
    x = points[:, 0]
    z = points[:, 1] 
    y = -points[:, 2]  # Convert back to standard coordinates
    
    # Filter points within range
    mask = np.sqrt(x**2 + y**2 + z**2) < 50  # 50 meter radius
    filtered_points = points[mask]
    
    return filtered_points
```

## Data Processing Details

### Coordinate System Conversion
- **Original LiDAR:** (X, Y, Z)
- **WebGL Format:** (X, Z, -Y) - Right-handed coordinate system

### Normalization
- **Range Data:** 0-200m → -1 to 1
- **Reflectivity:** 0-255 → 0 to 1 (with 8x contrast boost)

### Color Mapping (Reflectivity3D)
- **Red Channel:** Normalized reflectivity value
- **Green Channel:** Inverted (1 - reflectivity) for contrast
- **Blue Channel:** Full intensity (1.0)

## Configuration

### Server Configuration
```python
# File paths
PCAP_PATH = "your_file.pcap"
METADATA_PATH = "your_file.json" 
SENSOR_IDX = 0

# Server settings
HOST = "0.0.0.0"
PORT = 8000
```

### Performance Tuning
- Adjust the delay in `stream_data()` to control streaming speed:
  ```python
  await asyncio.sleep(0.01)  # 10ms delay between frames
  ```

- For high-frequency streaming, reduce or remove the delay
- For visualization, consider frame skipping for large datasets

### Chunking Configuration
Configure message size limits and chunking behavior:

```python
# Server-side chunking configuration
MAX_MESSAGE_SIZE = 512 * 1024  # 512KB threshold (default)
CHUNK_SIZE = 256 * 1024        # 256KB per chunk

# Adjust chunking parameters in stream_data()
await stream_data(websocket, "points3d", max_message_size=MAX_MESSAGE_SIZE)

# Within send_chunked_data(), adjust chunk size:
chunk_data_size = CHUNK_SIZE  # Configurable chunk size
```

**Chunking Guidelines:**
- **Small datasets:** Keep default 512KB threshold
- **Large point clouds:** May need chunking (Points3D ~1.5MB per frame)
- **High bandwidth:** Increase chunk size to 512KB or 1MB
- **Limited bandwidth:** Decrease chunk size to 128KB or 64KB
- **Memory constraints:** Use smaller chunks to reduce buffer usage

## Architecture

### Core Components

1. **LiDARProcessor Class**
   - Handles PCAP file loading and processing
   - Provides data normalization and formatting
   - Manages coordinate system conversions

2. **WebSocket Handlers**
   - Individual endpoints for each stream type
   - Automatic connection management
   - Error handling and logging

3. **Data Streaming**
   - Frame-by-frame processing
   - Automatic connection closure
   - Real-time data transmission

### Error Handling
- Connection drops are handled gracefully
- Processing errors are logged and reported to clients
- Malformed data is caught and logged

## Monitoring and Logging

The server provides comprehensive logging:
- Connection events (connect/disconnect)
- Frame processing progress
- Error conditions
- Performance metrics

Log levels can be adjusted by modifying:
```python
logging.basicConfig(level=logging.INFO)
```

## Production Considerations

1. **CORS Configuration:**
   ```python
   allow_origins=["https://yourdomain.com"]  # Restrict origins
   ```

2. **Rate Limiting:** Consider implementing rate limiting for production use

3. **Authentication:** Add authentication middleware if needed

4. **Load Balancing:** Use multiple server instances for high-concurrency scenarios

5. **Memory Management:** Monitor memory usage for large PCAP files

## Troubleshooting

### Common Issues

1. **File Not Found:**
   - Ensure PCAP and metadata files exist in the specified paths
   - Check file permissions

2. **Memory Issues:**
   - Large PCAP files may require significant memory
   - Consider processing smaller chunks or implementing streaming optimization

3. **Connection Issues:**
   - Verify firewall settings allow WebSocket connections
   - Check that the server is binding to the correct interface

4. **Data Format Issues:**
   - Ensure Ouster SDK version compatibility
   - Verify metadata file format matches PCAP version

5. **Message Too Big Errors:**
   - **Symptom:** WebSocket connections drop with "message too big" errors
   - **Cause:** Large 3D point cloud data (>1MB) exceeds WebSocket limits
   - **Solution:** The chunking implementation automatically handles this
   - **Verification:** Check server logs for "Chunking points3d frame" messages
   - **Tuning:** Adjust `max_message_size` parameter if needed:
     ```python
     # In stream_data() calls
     await stream_data(websocket, "points3d", max_message_size=256*1024)  # 256KB
     ```

6. **Chunking Issues:**
   - **Missing chunks:** Check network stability and client buffer handling
   - **Out-of-order chunks:** Client automatically handles reordering
   - **Memory usage:** Large frames require temporary buffers during reconstruction
   - **Debug chunking:** Enable verbose logging to see chunk details

### Debug Mode
Enable debug logging:
```python
logging.basicConfig(level=logging.DEBUG)
```

## License

This project is provided as-is for educational and development purposes.

## Dependencies

- FastAPI 0.104.1+
- uvicorn with standard extras
- numpy 1.24.0+
- ouster-sdk 0.11.0+
- websockets 12.0+
