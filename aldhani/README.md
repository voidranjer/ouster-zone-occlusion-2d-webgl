# WebGL Fragment Shader Experiment

An interactive WebGL application that demonstrates animated color patterns using fragment shaders.

![WebGL Animation](https://via.placeholder.com/600x300/000000/FFFFFF/?text=WebGL+Fragment+Shader+Animation)

## Features

- **Real-time fragment shader animation** with colorful sine wave patterns
- **Interactive controls** - Play/Pause and Reset functionality
- **Keyboard shortcuts** for accessibility
- **Responsive design** that works on desktop and mobile
- **Modern JavaScript architecture** with ES6+ modules
- **Error handling** with user-friendly messages
- **Performance optimizations** including automatic pause when tab is hidden

## Getting Started

### Prerequisites

- A modern web browser with WebGL support
- Local web server (for ES6 modules)

### Installation

1. Clone this repository or download the files
2. Serve the files using a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to `http://localhost:8000`

## Usage

### Controls

- **Play/Pause Button**: Start or stop the animation
- **Reset Button**: Reset the animation to the beginning
- **Keyboard Shortcuts**:
  - `Space` - Toggle play/pause
  - `R` - Reset animation
  - `Esc` - Unfocus canvas

### Browser Support

This application requires WebGL support. It will work in:

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Project Structure

```
/
├── index.html              # Main HTML file
├── src/
│   ├── styles/
│   │   └── main.css       # Main stylesheet
│   └── js/
│       ├── main.js        # Application entry point
│       ├── webgl-renderer.js  # WebGL rendering logic
│       ├── ui-controller.js   # UI management
│       └── shader-loader.js   # Shader loading utilities
├── README.md              # This file
└── package.json           # Project configuration
```

## Technical Details

### Architecture

The application is built using modern JavaScript with a modular architecture:

- **App**: Main application controller managing the lifecycle
- **WebGLRenderer**: Handles WebGL context, shaders, and rendering
- **UIController**: Manages user interface interactions
- **ShaderLoader**: Utility for loading and managing shaders

### Shaders

- **Vertex Shader**: Simple pass-through shader for full-screen quad
- **Fragment Shader**: Creates animated color patterns using sine waves

### Performance Features

- Automatic pause when browser tab is hidden
- Efficient full-screen quad rendering
- Proper WebGL resource cleanup
- RequestAnimationFrame for smooth animation

## Customization

### Modifying the Fragment Shader

To change the visual effect, edit the fragment shader in `index.html`:

```glsl
// Located in the script tag with id="fragment-shader"
void main() {
    vec2 position = -1.0 + 2.0 * gl_FragCoord.xy / u_resolution.xy;
    
    // Modify these lines to change the color pattern
    float red = abs(sin(position.x * position.y + u_time / 5.0));
    float green = abs(sin(position.x * position.y + u_time / 4.0));
    float blue = abs(sin(position.x * position.y + u_time / 3.0));
    
    gl_FragColor = vec4(red, green, blue, 1.0);
}
```

### Adding New Uniforms

1. Add the uniform declaration to the fragment shader
2. Get the uniform location in `webgl-renderer.js`
3. Set the uniform value in the render loop

## Development

### Code Style

- ES6+ modules and classes
- JSDoc comments for documentation
- Consistent error handling
- Accessibility considerations

### Error Handling

- WebGL context creation failures
- Shader compilation errors
- Resource loading errors
- Runtime exceptions

## Browser Compatibility

- **WebGL**: Required for core functionality
- **ES6 Modules**: Required for modern JavaScript features
- **CSS Custom Properties**: Used for theming (graceful degradation)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in multiple browsers
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Inspired by classic shader experiments and Shadertoy
- Built with modern web standards and best practices
- Thanks to the WebGL and web development communities
