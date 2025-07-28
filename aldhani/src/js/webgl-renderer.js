/**
 * WebGL renderer for fragment shader experiments
 */
export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.buffer = null;
        this.startTime = Date.now();
        
        // Uniform locations
        this.timeLocation = null;
        this.resolutionLocation = null;
        
        // Attribute locations
        this.positionLocation = null;
        
        // Animation parameters
        this.parameters = {
            startTime: this.startTime,
            time: 0,
            screenWidth: 0,
            screenHeight: 0
        };
    }

    /**
     * Initialize WebGL context and shaders
     */
    async init(vertexShaderSource, fragmentShaderSource) {
        try {
            // Get WebGL context
            this.initWebGLContext();
            
            // Create shader program
            this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
            if (!this.program) {
                throw new Error('Failed to create shader program');
            }
            
            // Get uniform and attribute locations
            this.getLocations();
            
            // Create geometry buffer
            this.createGeometry();
            
            // Set initial viewport
            this.handleResize(this.canvas.width, this.canvas.height);
            
            console.log('✅ WebGL renderer initialized');
            
        } catch (error) {
            throw new Error(`WebGL initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize WebGL context with proper error handling
     */
    initWebGLContext() {
        // Try to get WebGL2 context first, fall back to WebGL1
        this.gl = this.canvas.getContext('webgl2') || 
                  this.canvas.getContext('webgl') || 
                  this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL is not supported in this browser');
        }
        
        // Check for required extensions (if needed)
        // const ext = this.gl.getExtension('OES_standard_derivatives');
        
        console.log('WebGL Context:', {
            version: this.gl.getParameter(this.gl.VERSION),
            vendor: this.gl.getParameter(this.gl.VENDOR),
            renderer: this.gl.getParameter(this.gl.RENDERER)
        });
    }

    /**
     * Create and compile a shader
     */
    createShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}`);
        }
        
        return shader;
    }

    /**
     * Create shader program from vertex and fragment shaders
     */
    createProgram(vertexSource, fragmentSource) {
        try {
            const vertexShader = this.createShader(vertexSource, this.gl.VERTEX_SHADER);
            const fragmentShader = this.createShader(fragmentSource, this.gl.FRAGMENT_SHADER);
            
            const program = this.gl.createProgram();
            this.gl.attachShader(program, vertexShader);
            this.gl.attachShader(program, fragmentShader);
            
            this.gl.linkProgram(program);
            
            // Clean up shaders (they're now part of the program)
            this.gl.deleteShader(vertexShader);
            this.gl.deleteShader(fragmentShader);
            
            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                const error = this.gl.getProgramInfoLog(program);
                this.gl.deleteProgram(program);
                throw new Error(`Program linking error: ${error}`);
            }
            
            return program;
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get uniform and attribute locations
     */
    getLocations() {
        this.timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
        this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        
        if (this.positionLocation === -1) {
            console.warn('Position attribute not found in shader');
        }
    }

    /**
     * Create geometry buffer (full-screen quad)
     */
    createGeometry() {
        // Full-screen quad vertices
        const vertices = new Float32Array([
            -1.0, -1.0,  // Bottom left
             1.0, -1.0,  // Bottom right
            -1.0,  1.0,  // Top left
             1.0, -1.0,  // Bottom right
             1.0,  1.0,  // Top right
            -1.0,  1.0   // Top left
        ]);
        
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    }

    /**
     * Handle canvas resize
     */
    handleResize(width, height) {
        this.parameters.screenWidth = width;
        this.parameters.screenHeight = height;
        
        if (this.gl) {
            this.gl.viewport(0, 0, width, height);
        }
    }

    /**
     * Reset animation to initial state
     */
    reset() {
        this.startTime = Date.now();
        this.parameters.startTime = this.startTime;
    }

    /**
     * Render a frame
     */
    render() {
        if (!this.gl || !this.program) return;
        
        // Update time
        this.parameters.time = Date.now() - this.parameters.startTime;
        
        // Clear the canvas
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Use shader program
        this.gl.useProgram(this.program);
        
        // Set uniforms
        if (this.timeLocation !== null) {
            this.gl.uniform1f(this.timeLocation, this.parameters.time / 1000.0);
        }
        
        if (this.resolutionLocation !== null) {
            this.gl.uniform2f(
                this.resolutionLocation, 
                this.parameters.screenWidth, 
                this.parameters.screenHeight
            );
        }
        
        // Bind geometry and draw
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        
        if (this.positionLocation !== -1) {
            this.gl.enableVertexAttribArray(this.positionLocation);
            this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        }
        
        // Draw the quad
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        
        // Disable vertex attribute array
        if (this.positionLocation !== -1) {
            this.gl.disableVertexAttribArray(this.positionLocation);
        }
    }

    /**
     * Get WebGL context info for debugging
     */
    getInfo() {
        if (!this.gl) return null;
        
        return {
            version: this.gl.getParameter(this.gl.VERSION),
            vendor: this.gl.getParameter(this.gl.VENDOR),
            renderer: this.gl.getParameter(this.gl.RENDERER),
            maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
            maxViewportDims: this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS),
            extensions: this.gl.getSupportedExtensions()
        };
    }

    /**
     * Clean up WebGL resources
     */
    destroy() {
        if (this.gl) {
            if (this.buffer) {
                this.gl.deleteBuffer(this.buffer);
                this.buffer = null;
            }
            
            if (this.program) {
                this.gl.deleteProgram(this.program);
                this.program = null;
            }
        }
        
        this.gl = null;
    }
}
