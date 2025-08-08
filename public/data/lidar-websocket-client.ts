/**
 * TypeScript WebSocket client for LiDAR binary streams with chunking support.
 * 
 * This client connects to all five WebSocket streams and handles the binary protocol:
 * - range2d: 2D range image data (normalized distances)
 * - reflectivity2d: 2D reflectivity image data (normalized intensities)  
 * - points3d: 3D point cloud coordinates in WebGL format
 * - reflectivity3d: 3D point cloud with reflectivity color mapping
 * - combined2D: Combined 3D coordinates + reflectivity in flat array format
 * 
 * Supports automatic chunking for large messages with reconstruction.
 */

// Type definitions
export interface LiDARFrame {
  streamType: string;
  frameNumber: number;
  shape: number[];
  minVal: number;
  maxVal: number;
  data: Float32Array;
  dataSizeBytes: number;
}

export interface StreamCallbacks {
  onRange2D?: (frame: LiDARFrame) => void;
  onReflectivity2D?: (frame: LiDARFrame) => void;
  onPoints3D?: (frame: LiDARFrame) => void;
  onReflectivity3D?: (frame: LiDARFrame) => void;
  onCombined2D?: (frame: LiDARFrame) => void;
  onError?: (streamType: string, error: string) => void;
  onConnect?: (streamType: string) => void;
  onDisconnect?: (streamType: string) => void;
}

interface ChunkBuffer {
  chunks: Map<number, Uint8Array>;
  totalChunks: number;
  streamTypeId: number;
}

interface FrameChunkBuffers {
  [frameNumber: number]: ChunkBuffer;
}

// Binary protocol constants
const MAGIC_BYTES_LIDR = new Uint8Array([76, 73, 68, 82]); // "LIDR"
const MAGIC_BYTES_CHUN = new Uint8Array([67, 72, 85, 78]); // "CHUN"
const MAGIC_BYTES_EOFR = new Uint8Array([69, 79, 70, 82]); // "EOFR"

const STREAM_TYPES = {
  0: 'range2d',
  1: 'reflectivity2d', 
  2: 'points3d',
  3: 'reflectivity3d',
  4: 'combined2d'
} as const;

const STREAM_TYPE_IDS = {
  'range2d': 0,
  'reflectivity2d': 1,
  'points3d': 2,
  'reflectivity3d': 3,
  'combined2d': 4
} as const;

export class LiDARWebSocketClient {
  private serverUrl: string;
  private connections: Map<string, WebSocket> = new Map();
  private callbacks: StreamCallbacks;
  private chunkBuffers: Map<string, FrameChunkBuffers> = new Map();
  private frameCounters: Map<string, number> = new Map();
  private dataReceived: Map<string, number> = new Map();

  constructor(serverUrl: string = 'ws://localhost:8000', callbacks: StreamCallbacks = {}) {
    this.serverUrl = serverUrl;
    this.callbacks = callbacks;
    
    // Initialize counters and buffers for each stream
    const streamTypes = ['range2d', 'reflectivity2d', 'points3d', 'reflectivity3d', 'combined2d'];
    streamTypes.forEach(streamType => {
      this.frameCounters.set(streamType, 0);
      this.dataReceived.set(streamType, 0);
      this.chunkBuffers.set(streamType, {});
    });
  }

  /**
   * Connect to all five LiDAR streams simultaneously
   */
  public async connectAllStreams(): Promise<void> {
    console.log('Starting LiDAR WebSocket client - connecting to all streams...');
    console.log('Binary Protocol: 32-byte header + float32 data');
    console.log('='.repeat(60));

    const streamTypes = ['range2d', 'reflectivity2d', 'points3d', 'reflectivity3d', 'combined2d'];
    const connectionPromises = streamTypes.map(streamType => 
      this.connectToStream(streamType)
    );

    // Start all connections
    await Promise.allSettled(connectionPromises);
  }

  /**
   * Connect to a specific stream
   */
  public async connectToStream(streamType: string): Promise<void> {
    const url = `${this.serverUrl}/ws/${streamType}`;
    
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to ${streamType} stream at ${url}`);
        
        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer'; // Important: set binary type
        
        ws.onopen = () => {
          console.log(`${streamType} stream connected`);
          this.connections.set(streamType, ws);
          this.callbacks.onConnect?.(streamType);
          resolve();
        };

        ws.onmessage = async (event) => {
          try {
            if (event.data instanceof ArrayBuffer) {
              // Handle binary message
              await this.handleBinaryMessage(streamType, new Uint8Array(event.data));
            } else if (typeof event.data === 'string') {
              // Handle text message (likely error)
              const errorData = JSON.parse(event.data);
              if (errorData.error) {
                console.error(`Error from ${streamType}:`, errorData.error);
                this.callbacks.onError?.(streamType, errorData.error);
              }
            } else {
              console.warn(`Unknown message type from ${streamType}:`, typeof event.data);
            }
          } catch (error) {
            console.error(`Error handling message for ${streamType}:`, error);
            this.callbacks.onError?.(streamType, error instanceof Error ? error.message : String(error));
          }
        };

        ws.onclose = () => {
          console.log(`${streamType} stream connection closed`);
          this.connections.delete(streamType);
          this.callbacks.onDisconnect?.(streamType);
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for ${streamType}:`, error);
          this.callbacks.onError?.(streamType, 'WebSocket connection error');
          reject(error);
        };

      } catch (error) {
        console.error(`Error connecting to ${streamType} stream:`, error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from all streams
   */
  public disconnectAll(): void {
    this.connections.forEach((ws, streamType) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.connections.clear();
    console.log('All streams disconnected');
  }

  /**
   * Disconnect from a specific stream
   */
  public disconnectStream(streamType: string): void {
    const ws = this.connections.get(streamType);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    this.connections.delete(streamType);
    console.log(`${streamType} stream disconnected`);
  }

  /**
   * Handle incoming binary message with chunking support
   */
  private async handleBinaryMessage(streamType: string, message: Uint8Array): Promise<void> {
    try {
      if (message.length < 32) {
        throw new Error('Message too short for header');
      }

      // Check message type by magic bytes
      const magic = message.slice(0, 4);
      
      if (this.arraysEqual(magic, MAGIC_BYTES_CHUN)) {
        // Handle chunk message
        await this.handleChunkMessage(streamType, message);
      } else if (this.arraysEqual(magic, MAGIC_BYTES_EOFR)) {
        // Handle end-of-frame message and reconstruct
        await this.handleEndOfFrame(streamType, message);
      } else if (this.arraysEqual(magic, MAGIC_BYTES_LIDR)) {
        // Handle regular (non-chunked) message
        await this.handleRegularMessage(streamType, message);
      } else {
        console.warn(`Unknown message magic for ${streamType}:`, magic);
      }

    } catch (error) {
      console.error(`Error handling binary message for ${streamType}:`, error);
      this.callbacks.onError?.(streamType, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Handle a chunk message
   */
  private async handleChunkMessage(streamType: string, message: Uint8Array): Promise<void> {
    // Parse chunk header (32 bytes, little-endian)
    const view = new DataView(message.buffer, message.byteOffset, message.byteLength);
    
    const magic = message.slice(0, 4);
    const streamTypeId = view.getUint32(4, true);
    const frameNumber = view.getUint32(8, true);
    const chunkIdx = view.getUint32(12, true);
    const totalChunks = view.getUint32(16, true);
    const startOffset = view.getFloat32(20, true);
    const endOffset = view.getFloat32(24, true);
    const chunkSize = view.getUint32(28, true);

    // Extract chunk data
    const chunkData = message.slice(32, 32 + chunkSize);

    // Initialize frame buffer if needed
    const streamChunkBuffers = this.chunkBuffers.get(streamType)!;
    if (!(frameNumber in streamChunkBuffers)) {
      streamChunkBuffers[frameNumber] = {
        chunks: new Map(),
        totalChunks: totalChunks,
        streamTypeId: streamTypeId
      };
    }

    // Store chunk
    streamChunkBuffers[frameNumber].chunks.set(chunkIdx, chunkData);

    console.log(`  Received chunk ${chunkIdx + 1}/${totalChunks} for ${streamType} frame ${frameNumber} (${chunkData.length} bytes)`);
  }

  /**
   * Handle end-of-frame message and reconstruct the full frame
   */
  private async handleEndOfFrame(streamType: string, message: Uint8Array): Promise<void> {
    // Parse end-of-frame header
    const view = new DataView(message.buffer, message.byteOffset, message.byteLength);
    
    const magic = message.slice(0, 4);
    const streamTypeId = view.getUint32(4, true);
    const frameNumber = view.getUint32(8, true);
    const totalDataSize = view.getUint32(12, true);
    const totalChunks = view.getUint32(16, true);

    // Get original header (32 bytes starting at offset 32)
    const originalHeader = message.slice(32, 64);

    // Check if we have all chunks
    const streamChunkBuffers = this.chunkBuffers.get(streamType)!;
    const frameBuffer = streamChunkBuffers[frameNumber];

    if (frameBuffer && frameBuffer.chunks.size === totalChunks) {
      // Reconstruct data by concatenating chunks in order
      const sortedChunkIndices = Array.from(frameBuffer.chunks.keys()).sort((a, b) => a - b);
      
      let totalLength = 0;
      sortedChunkIndices.forEach(idx => {
        totalLength += frameBuffer.chunks.get(idx)!.length;
      });

      const reconstructedData = new Uint8Array(totalLength);
      let offset = 0;
      
      sortedChunkIndices.forEach(idx => {
        const chunkData = frameBuffer.chunks.get(idx)!;
        reconstructedData.set(chunkData, offset);
        offset += chunkData.length;
      });

      // Create complete message: original header + reconstructed data
      const completeMessage = new Uint8Array(32 + reconstructedData.length);
      completeMessage.set(originalHeader, 0);
      completeMessage.set(reconstructedData, 32);

      // Process as regular message
      await this.handleRegularMessage(streamType, completeMessage);

      // Clean up
      delete streamChunkBuffers[frameNumber];

      console.log(`  -> Reconstructed ${streamType} frame ${frameNumber} from ${totalChunks} chunks (${reconstructedData.length} bytes)`);
    } else {
      const chunksReceived = frameBuffer ? frameBuffer.chunks.size : 0;
      console.warn(`  Missing chunks for ${streamType} frame ${frameNumber}: got ${chunksReceived}, expected ${totalChunks}`);
    }
  }

  /**
   * Handle a regular (non-chunked) message
   */
  private async handleRegularMessage(streamType: string, message: Uint8Array): Promise<void> {
    const parsedData = this.parseBinaryMessage(message);
    
    // Update counters
    const currentFrameCount = this.frameCounters.get(streamType)! + 1;
    const currentDataReceived = this.dataReceived.get(streamType)! + parsedData.dataSizeBytes;
    
    this.frameCounters.set(streamType, currentFrameCount);
    this.dataReceived.set(streamType, currentDataReceived);

    const dataSizeMB = parsedData.dataSizeBytes / (1024 * 1024);

    // Print summary information
    console.log(
      `${streamType.toUpperCase()} Frame ${parsedData.frameNumber}: ` +
      `Shape=${JSON.stringify(parsedData.shape)}, Range=[${parsedData.minVal.toFixed(3)}, ${parsedData.maxVal.toFixed(3)}], ` +
      `Size=${dataSizeMB.toFixed(2)}MB`
    );

    // Call appropriate callback based on stream type
    switch (streamType) {
      case 'range2d':
        this.callbacks.onRange2D?.(parsedData);
        break;
      case 'reflectivity2d':
        this.callbacks.onReflectivity2D?.(parsedData);
        break;
      case 'points3d':
        this.callbacks.onPoints3D?.(parsedData);
        break;
      case 'reflectivity3d':
        this.callbacks.onReflectivity3D?.(parsedData);
        break;
      case 'combined2d':
        this.callbacks.onCombined2D?.(parsedData);
        break;
    }
  }

  /**
   * Parse binary message from the server
   */
  private parseBinaryMessage(message: Uint8Array): LiDARFrame {
    if (message.length < 32) {
      throw new Error('Message too short for header');
    }

    // Parse header (32 bytes, little-endian)
    const view = new DataView(message.buffer, message.byteOffset, message.byteLength);
    
    const magic = message.slice(0, 4);
    const streamTypeId = view.getUint32(4, true);
    const frameNumber = view.getUint32(8, true);
    const shape0 = view.getUint32(12, true);
    const shape1 = view.getUint32(16, true);
    const minVal = view.getFloat32(20, true);
    const maxVal = view.getFloat32(24, true);
    const reserved = view.getUint32(28, true);

    if (!this.arraysEqual(magic, MAGIC_BYTES_LIDR)) {
      throw new Error(`Invalid magic bytes: ${magic}`);
    }

    if (!(streamTypeId in STREAM_TYPES)) {
      throw new Error(`Unknown stream type: ${streamTypeId}`);
    }

    const streamType = STREAM_TYPES[streamTypeId as keyof typeof STREAM_TYPES];

    // Calculate expected data size
    const dataSize = shape0 * Math.max(shape1, 1) * 4; // float32 = 4 bytes
    const expectedSize = 32 + dataSize;

    if (message.length !== expectedSize) {
      throw new Error(
        `Message size mismatch: expected ${expectedSize}, got ${message.length}`
      );
    }

    // Parse data as Float32Array
    const dataBuffer = message.buffer.slice(
      message.byteOffset + 32,
      message.byteOffset + message.length
    );
    const dataArray = new Float32Array(dataBuffer);

    return {
      streamType: streamType,
      frameNumber: frameNumber,
      shape: shape1 > 0 ? [shape0, shape1] : [shape0],
      minVal: minVal,
      maxVal: maxVal,
      data: dataArray,
      dataSizeBytes: dataArray.length * 4
    };
  }

  /**
   * Utility function to compare two Uint8Arrays
   */
  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Get connection statistics
   */
  public getStats(): { [streamType: string]: { frames: number; dataReceivedMB: number } } {
    const stats: { [streamType: string]: { frames: number; dataReceivedMB: number } } = {};
    
    this.frameCounters.forEach((frames, streamType) => {
      const dataReceivedMB = (this.dataReceived.get(streamType) || 0) / (1024 * 1024);
      stats[streamType] = {
        frames: frames,
        dataReceivedMB: dataReceivedMB
      };
    });

    return stats;
  }

  /**
   * Check if a specific stream is connected
   */
  public isConnected(streamType: string): boolean {
    const ws = this.connections.get(streamType);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  /**
   * Get the current connection status of all streams
   */
  public getConnectionStatus(): { [streamType: string]: boolean } {
    const status: { [streamType: string]: boolean } = {};
    const streamTypes = ['range2d', 'reflectivity2d', 'points3d', 'reflectivity3d', 'combined2d'];
    
    streamTypes.forEach(streamType => {
      status[streamType] = this.isConnected(streamType);
    });

    return status;
  }
}

// Export utility functions for external use
export function createLiDARClient(serverUrl?: string, callbacks?: StreamCallbacks): LiDARWebSocketClient {
  return new LiDARWebSocketClient(serverUrl, callbacks);
}

// Example usage (commented out - you can uncomment to test)
/*
// Example of how to use the client:
const callbacks: StreamCallbacks = {
  onRange2D: (frame) => {
    console.log('Range2D data received:', frame.shape, frame.data.length);
    // Process 2D range image data
    // frame.data can be reshaped to frame.shape for 2D processing
  },
  
  onReflectivity2D: (frame) => {
    console.log('Reflectivity2D data received:', frame.shape, frame.data.length);
    // Process 2D reflectivity image data
  },
  
  onPoints3D: (frame) => {
    console.log('Points3D data received:', frame.shape, frame.data.length);
    // frame.data contains [x, z, -y] coordinates in WebGL format
    // Use for 3D point cloud rendering
  },
  
  onReflectivity3D: (frame) => {
    console.log('Reflectivity3D data received:', frame.shape, frame.data.length);
    // frame.data contains [r, g, b] color values for point cloud
  },
  
  onCombined2D: (frame) => {
    console.log('Combined2D data received:', frame.shape, frame.data.length);
    // frame.data contains flat array [x1, y1, z1, reflectivity1, x2, y2, z2, reflectivity2, ...]
    // Use for combined 3D coordinates + reflectivity processing
  },
  
  onConnect: (streamType) => {
    console.log(`Connected to ${streamType}`);
  },
  
  onDisconnect: (streamType) => {
    console.log(`Disconnected from ${streamType}`);
  },
  
  onError: (streamType, error) => {
    console.error(`Error in ${streamType}:`, error);
  }
};

const client = createLiDARClient('ws://localhost:8000', callbacks);

// Connect to all streams
client.connectAllStreams();

// Or connect to individual streams
// await client.connectToStream('points3d');

// Check connection status
// console.log('Connection status:', client.getConnectionStatus());

// Get statistics
// console.log('Stats:', client.getStats());

// Disconnect when done
// client.disconnectAll();
*/
