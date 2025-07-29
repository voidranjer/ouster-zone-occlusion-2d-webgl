/**
 * UI Controller for managing user interface interactions
 */
export class UIController {
    constructor() {
        this.app = null;
        this.playPauseButton = null;
        this.resetButton = null;
        this.errorMessage = null;
        
        // Bind methods to preserve context
        this.handlePlayPause = this.handlePlayPause.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }

    /**
     * Initialize UI controller with app reference
     */
    init(app) {
        this.app = app;
        this.setupElements();
        this.setupEventListeners();
        
        console.log('✅ UI controller initialized');
    }

    /**
     * Setup DOM element references
     */
    setupElements() {
        this.playPauseButton = document.getElementById('play-pause');
        this.resetButton = document.getElementById('reset');
        this.errorMessage = document.getElementById('error-message');
        
        if (!this.playPauseButton) {
            console.warn('Play/Pause button not found');
        }
        
        if (!this.resetButton) {
            console.warn('Reset button not found');
        }
        
        if (!this.errorMessage) {
            console.warn('Error message element not found');
        }
    }

    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        if (this.playPauseButton) {
            this.playPauseButton.addEventListener('click', this.handlePlayPause);
        }
        
        if (this.resetButton) {
            this.resetButton.addEventListener('click', this.handleReset);
        }
    }

    /**
     * Handle play/pause button click
     */
    handlePlayPause() {
        if (!this.app) return;
        
        this.app.toggle();
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        if (!this.app) return;
        
        this.app.reset();
        this.hideError();
    }

    /**
     * Update play/pause button text and state
     */
    updatePlayPauseButton(isPlaying) {
        if (!this.playPauseButton) return;
        
        this.playPauseButton.textContent = isPlaying ? 'Pause' : 'Play';
        this.playPauseButton.setAttribute('aria-label', 
            isPlaying ? 'Pause animation' : 'Play animation'
        );
        
        // Update button appearance
        if (isPlaying) {
            this.playPauseButton.classList.remove('paused');
            this.playPauseButton.classList.add('playing');
        } else {
            this.playPauseButton.classList.remove('playing');
            this.playPauseButton.classList.add('paused');
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        if (!this.errorMessage) {
            console.error('Error message element not found, displaying in console:', message);
            return;
        }
        
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide error after 10 seconds
        setTimeout(() => {
            this.hideError();
        }, 10000);
    }

    /**
     * Hide error message
     */
    hideError() {
        if (!this.errorMessage) return;
        
        this.errorMessage.classList.add('hidden');
    }

    /**
     * Show loading state
     */
    showLoading() {
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.classList.add('loading');
        }
        
        // Disable controls during loading
        this.setControlsEnabled(false);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.classList.remove('loading');
        }
        
        // Re-enable controls
        this.setControlsEnabled(true);
    }

    /**
     * Enable or disable control buttons
     */
    setControlsEnabled(enabled) {
        const buttons = [this.playPauseButton, this.resetButton];
        
        buttons.forEach(button => {
            if (button) {
                button.disabled = !enabled;
            }
        });
    }

    /**
     * Update UI with WebGL context information
     */
    updateWebGLInfo(info) {
        if (!info) return;
        
        // Create or update info display
        let infoElement = document.getElementById('webgl-info');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'webgl-info';
            infoElement.className = 'webgl-info';
            
            const infoPanel = document.getElementById('info');
            if (infoPanel) {
                infoPanel.appendChild(infoElement);
            }
        }
        
        infoElement.innerHTML = `
            <details>
                <summary>WebGL Info</summary>
                <dl class="webgl-details">
                    <dt>Version:</dt><dd>${info.version}</dd>
                    <dt>Vendor:</dt><dd>${info.vendor}</dd>
                    <dt>Renderer:</dt><dd>${info.renderer}</dd>
                </dl>
            </details>
        `;
    }

    /**
     * Add keyboard shortcut hints to UI
     */
    addKeyboardHints() {
        const infoPanel = document.getElementById('info');
        if (!infoPanel) return;
        
        const hintsElement = document.createElement('div');
        hintsElement.className = 'keyboard-hints';
        hintsElement.innerHTML = `
            <h3>Keyboard Shortcuts</h3>
            <ul>
                <li><kbd>Space</kbd> - Play/Pause</li>
                <li><kbd>R</kbd> - Reset</li>
                <li><kbd>Esc</kbd> - Unfocus canvas</li>
            </ul>
        `;
        
        infoPanel.appendChild(hintsElement);
    }

    /**
     * Create performance monitor display
     */
    createPerformanceMonitor() {
        const monitor = document.createElement('div');
        monitor.id = 'performance-monitor';
        monitor.className = 'performance-monitor hidden';
        monitor.innerHTML = `
            <h4>Performance</h4>
            <div class="perf-stats">
                <span id="fps-counter">FPS: --</span>
                <span id="frame-time">Frame: --ms</span>
            </div>
        `;
        
        const infoPanel = document.getElementById('info');
        if (infoPanel) {
            infoPanel.appendChild(monitor);
        }
        
        return monitor;
    }

    /**
     * Update performance monitor
     */
    updatePerformance(fps, frameTime) {
        const fpsCounter = document.getElementById('fps-counter');
        const frameTimeElement = document.getElementById('frame-time');
        
        if (fpsCounter) {
            fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
        }
        
        if (frameTimeElement) {
            frameTimeElement.textContent = `Frame: ${frameTime.toFixed(2)}ms`;
        }
    }

    /**
     * Toggle performance monitor visibility
     */
    togglePerformanceMonitor() {
        const monitor = document.getElementById('performance-monitor');
        if (monitor) {
            monitor.classList.toggle('hidden');
        }
    }

    /**
     * Clean up event listeners and references
     */
    destroy() {
        // Remove event listeners
        if (this.playPauseButton) {
            this.playPauseButton.removeEventListener('click', this.handlePlayPause);
        }
        
        if (this.resetButton) {
            this.resetButton.removeEventListener('click', this.handleReset);
        }
        
        // Clear references
        this.app = null;
        this.playPauseButton = null;
        this.resetButton = null;
        this.errorMessage = null;
    }
}
