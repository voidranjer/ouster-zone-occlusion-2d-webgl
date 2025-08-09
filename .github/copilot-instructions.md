# Copilot Instructions for LiDAR Point Cloud Visualization

This is a dual-rendering WebGL2 + Three.js application for visualizing LiDAR point cloud data with interactive zone editing and sensor extrinsics calibration.

## Architecture Overview

### Dual Canvas System
- **WebGL Canvas** (`#webgl-canvas`): 2D cylindrical projection using raw WebGL2 for high-performance point rendering
- **Three.js Canvas** (`#threejs-canvas`): 3D scene with point cloud, zone editing, and sensor extrinsics visualization
- Both canvases are synchronized and render the same data in different projections

### Key Components
- `src/main.ts`: WebGL2 rendering pipeline for 2D projection
- `src/threejs/index.ts`: Three.js 3D scene setup and extrinsics handling
- `src/threejs/eventHandlers.ts`: Interactive zone editing with mouse events
- `public/shaders/`: GLSL shaders for point cloud and zone rendering

## Data Flow & Coordinate Systems

### Point Cloud Data Pipeline
```typescript
// Data sources (JSON format expected):
// - data/points.json: 3D coordinates [[x,y,z], ...]
// - data/points_reflectivity.json: Color data [[r,g,b], ...]
// - data/range.json: 2D range image (rows x cols)
// - data/reflectivity.json: 2D reflectivity image
```

### Coordinate Transformations
- **WebGL 2D**: Cylindrical projection using `atan2(y,x)` for azimuth, `z` for elevation
- **Three.js 3D**: Direct XYZ coordinates with Y-up orientation
- **Zone coordinates**: XZ plane projection for floor-based zone editing

## Interactive Systems

### Zone Editing Modes
```typescript
// Controlled via localStorage mode state:
localStorage.setItem('mode', 'edit');    // Click to place zone vertices
localStorage.setItem('mode', 'highlight'); // Hover to create dynamic zones
```

### Extrinsics Calibration
- Floating UI panel with sliders for 6DOF sensor positioning
- Real-time transformation updates via `updateExtrinsics(translation, rotation)`
- Values persist in localStorage as JSON: `{translation: {x,y,z}, rotation: {x,y,z}}`

## Development Patterns

### WebGL Resource Management
- Always bind VAOs before setting up buffers: `gl.bindVertexArray(vao)`
- Shader compilation uses `compileShader()` utility with error handling
- Point rendering uses `gl.POINTS` primitive with size controlled by `gl_PointSize`

### Three.js Integration
- Scene exports: `scene`, `camera`, `renderer`, `extrinsicsHelper` for external access
- OrbitControls disabled during edit mode: `controls.enabled = localStorage.getItem('mode') !== 'edit'`
- Raycasting for plane intersection: `raycaster.intersectObject(plane)`

### Shader Communication
```glsl
// Zone highlighting in vertex shader:
uniform vec2 u_xzVertices[4]; // Zone boundaries passed as uniform
// Point-in-polygon test determines color in shader
```

## Key Conventions

### File Organization
- WebGL utilities: `src/lib/utils.ts` (compileShader, createProgram, etc.)
- Three.js utilities: `src/threejs/utils.ts` (createLine, resetZone, etc.)
- Constants: `MAX_ROWS=128`, `MAX_COLS=1024` for Ouster OS-1-128 sensor

### Error Handling
- Shader compilation errors thrown with detailed logs
- WebGL context validation before operations
- Graceful degradation for missing data files

### Performance Optimization
- Point data loaded once into GPU buffers
- 60fps target with depth testing enabled
- Optimized for 100K-1M point clouds

## Development Workflow

```bash
npm run dev    # Hot reload development server
npm run build  # TypeScript compilation + Vite build
```

### Debugging
- Use browser WebGL inspector for shader debugging
- Console logs for zone vertex coordinates and mode changes
- Three.js scene hierarchy inspection via `scene.children`

## Critical Integration Points

### Canvas Synchronization
- Both canvases resize together via `resize()` and `threejsResize()`
- Shared mouse event handling between 2D/3D projections
- Zone vertices (`xzVertices`) shared between rendering contexts

### Shader-CPU Communication
- Zone boundaries uploaded as `u_xzVertices` uniform array
- Point-in-polygon testing performed in GPU for performance
- Color highlighting controlled by shader logic, not CPU filtering

### State Management
- Mode switching via localStorage for persistence across reloads
- Extrinsics data serialized to localStorage as JSON
- Zone reset functionality clears both Three.js objects and coordinate arrays

## External Dependencies

- **Three.js**: 3D rendering, OrbitControls, matrix operations
- **Vite**: Development server and bundling
- **TailwindCSS**: UI styling for controls panel
- **WebGL2**: Required browser feature (no fallback)
