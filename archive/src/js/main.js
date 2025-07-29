import { WebGLRenderer } from './webgl-renderer.js';
import { UIController } from './ui-controller.js';
import { ShaderLoader } from './shader-loader.js';

/**
 * Main application class for the WebGL Fragment Shader Experiment
 */
class App {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.uiController = null;
        this.shaderLoader = null;
        this.isRunning = false;
        this.animationId = null;
        
        // Bind methods to preserve context
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.setupCanvas();
            this.setupEventListeners();
            
            // Initialize components
            this.shaderLoader = new ShaderLoader();
            this.uiController = new UIController();
            this.renderer = new WebGLRenderer(this.canvas);
            
            // Load shaders
            const vertexShader = this.shaderLoader.getShaderSource('vertex-shader');
            const fragmentShader = this.shaderLoader.getShaderSource('fragment-shader');
            
            // Initialize WebGL renderer
            await this.renderer.init(vertexShader, fragmentShader);
            
            // Initialize UI
            this.uiController.init(this);
            
            // Start the animation loop
            this.start();
            
            console.log('✅ WebGL application initialized successfully');
            
        } catch (error) {
            this.handleError('Failed to initialize application', error);
        }
    }

    /**
     * Setup canvas element and initial state
     */
    setupCanvas() {
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Make canvas focusable for accessibility
        this.canvas.tabIndex = 0;
        
        // Set initial size
        this.handleResize();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.handleResize);
        
        // Visibility change (pause when tab is not active)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    this.toggle();
                    break;
                case 'KeyR':
                    event.preventDefault();
                    this.reset();
                    break;
                case 'Escape':
                    this.canvas.blur();
                    break;
            }
        });
        
        // Canvas click to focus
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Check if canvas size needs to be updated
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            
            if (this.renderer) {
                this.renderer.handleResize(displayWidth, displayHeight);
            }
        }
    }

    /**
     * Handle visibility change (pause when tab is hidden)
     */
    handleVisibilityChange() {
        if (document.hidden && this.isRunning) {
            this.pause();
        } else if (!document.hidden && !this.isRunning) {
            this.start();
        }
    }

    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
        
        if (this.uiController) {
            this.uiController.updatePlayPauseButton(true);
        }
    }

    /**
     * Pause the animation loop
     */
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.uiController) {
            this.uiController.updatePlayPauseButton(false);
        }
    }

    /**
     * Toggle between play and pause
     */
    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    /**
     * Reset the animation to initial state
     */
    reset() {
        if (this.renderer) {
            this.renderer.reset();
        }
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.isRunning) return;
        
        try {
            // Render frame
            if (this.renderer) {
                this.renderer.render();
            }
            
            // Schedule next frame
            this.animationId = requestAnimationFrame(this.animate);
            
        } catch (error) {
            this.handleError('Error in animation loop', error);
        }
    }

    /**
     * Handle errors with user-friendly messages
     */
    handleError(message, error) {
        console.error(`❌ ${message}:`, error);
        
        if (this.uiController) {
            this.uiController.showError(`${message}: ${error.message}`);
        }
        
        // Stop animation on critical errors
        this.pause();
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Stop animation
        this.pause();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Cleanup components
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        if (this.uiController) {
            this.uiController.destroy();
        }
    }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    
    try {
        await app.init();
        
        // Make app available globally for debugging
        window.webglApp = app;
        
    } catch (error) {
        console.error('Failed to start application:', error);
        
        // Show error in UI
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Failed to start application: ${error.message}`;
            errorElement.classList.remove('hidden');
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.webglApp) {
        window.webglApp.destroy();
    }
});
