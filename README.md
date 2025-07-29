# Point Cloud 2D Viewer with Occlusion Zones

A modern WebGL2-based 2D viewer for point cloud data that projects 3D lidar point clouds into 2D cylindrical projections with support for zone highlighting and occlusion handling.

Bootstrapped with [Vite (`vanilla-ts`)](https://vite.dev/guide/).

![Point Cloud Viewer](https://via.placeholder.com/800x400/000000/FFFFFF/?text=2D+Point+Cloud+Viewer+with+Occlusion)

## Overview

This project transforms 3D point cloud data into 2D visualizations using cylindrical coordinate projection. The key feature is the ability to define rectangular zones on the "floor" that are rendered with proper occlusion - zones are hidden behind foreground points, creating realistic depth perception.

## Features

- **Vendor-Neutral Point Cloud Support**: Designed for Ouster lidar but works with any 3D point cloud data
- **2D Cylindrical Projection**: Converts 3D coordinates to 2D using `atan2(y, x)` for horizontal angle and `z` for vertical position
- **Zone Highlighting**: Define rectangular regions that are highlighted on the "floor"
- **Proper Occlusion**: Zones are correctly hidden behind foreground points using WebGL depth testing
- **Real-time Rendering**: WebGL2-based rendering with 60fps performance
- **TypeScript**: Type-safe development with modern ES6+ features

## Technical Architecture

### Coordinate Transformation

The viewer transforms 3D lidar coordinates `(x, y, z)` into 2D screen coordinates:

```typescript
// Cylindrical projection
const screenX = Math.atan2(coord[1], coord[0]) / Math.PI; // Horizontal angle [-1, 1]
const screenY = coord[2]; // Vertical position (height)
const screenZ = 0; // Depth for occlusion
```

### Rendering Pipeline

1. **Point Cloud Rendering**: Individual lidar points rendered as WebGL points
2. **Zone Rendering**: Rectangular regions rendered as triangle strips
3. **Depth Testing**: WebGL depth buffer ensures proper occlusion of zones behind points

### WebGL Shaders

- **Points Vertex Shader**: Transforms 3D coordinates to screen space
- **Points Fragment Shader**: Renders individual points with optional circular shape
- **Lines Vertex Shader**: Handles zone geometry
- **Lines Fragment Shader**: Renders highlighted zone areas

## Getting Started

### Prerequisites

- Node.js 16+
- Modern web browser with WebGL2 support
- TypeScript 5.8+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd occlusion-web

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. **Point Cloud Data**: Place your point cloud data in `public/data/points.txt`

   - Format: `x y z` coordinates, one point per line
   - Example: `-1.935765 0.328367 0.867215`

2. **Run the Application**:

   ```bash
   npm run dev
   ```

3. **View in Browser**: Navigate to `http://localhost:5173`

## Data Format

### Point Cloud Input

The viewer expects point cloud data in a simple text format:

```
x1 y1 z1
x2 y2 z2
x3 y3 z3
...
```

Where:

- `x, y`: Horizontal coordinates (meters)
- `z`: Vertical coordinate (height in meters)

### Zone Definition

Zones are currently defined programmatically in the code:

```typescript
const zones = [
  [1, -0.1, 0.5], // bottom right
  [1, 0.1, 0.5], // top right
  [-1, 0.1, 0.5], // top left
  [-1, -0.1, 0.5], // bottom left
];
```

## Project Structure

```
occlusion-web/
├── src/
│   ├── main.ts              # Application entry point
│   ├── lib/
│   │   ├── utils.ts         # WebGL utilities and helpers
│   │   └── constants.ts     # Shared constants
│   └── style.css           # Application styles
├── public/
│   ├── shaders/
│   │   ├── points.vert      # Point cloud vertex shader
│   │   ├── points.frag      # Point cloud fragment shader
│   │   ├── lines.vert       # Zone vertex shader
│   │   └── lines.frag       # Zone fragment shader
│   └── data/
│       └── points.txt       # Sample point cloud data
├── index.html              # HTML entry point
├── package.json            # Project configuration
└── tsconfig.json          # TypeScript configuration
```

## Development

### Building

```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Performance Considerations

- **Point Count**: Optimized for ~100K-1M points
- **WebGL2**: Leverages modern GPU features
- **Memory**: Point data loaded into GPU buffers
- **Rendering**: 60fps target with proper depth testing

## Browser Support

- Chrome/Chromium 80+ (recommended)
- Firefox 80+
- Safari 14+
- Edge 80+

**Requirements**: WebGL2 support is mandatory

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- TypeScript with strict type checking
- Modern ES6+ features
- Consistent WebGL resource management
- Comprehensive error handling

## License

This project is open source and available under the [MIT License](LICENSE).

## Roadmap

- [ ] Interactive zone editing
- [ ] Multiple zone colors/types
- [ ] Point cloud filtering controls
- [ ] Export functionality
- [ ] WebAssembly optimization for large datasets
- [ ] Real-time lidar streaming support

## Acknowledgments

- Built with modern WebGL2 and TypeScript
- Inspired by robotics visualization tools
- Designed for practical lidar data analysis
- Thanks to the WebGL and point cloud communities
