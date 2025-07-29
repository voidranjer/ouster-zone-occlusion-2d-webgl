/**
 * Shader loader utility for managing vertex and fragment shaders
 */
export class ShaderLoader {
    constructor() {
        this.shaderCache = new Map();
    }

    /**
     * Get shader source from DOM script tag
     */
    getShaderSource(elementId) {
        // Check cache first
        if (this.shaderCache.has(elementId)) {
            return this.shaderCache.get(elementId);
        }

        const shaderScript = document.getElementById(elementId);
        if (!shaderScript) {
            throw new Error(`Shader script element with id '${elementId}' not found`);
        }

        const source = shaderScript.textContent.trim();
        if (!source) {
            throw new Error(`Shader script element '${elementId}' is empty`);
        }

        // Cache the shader source
        this.shaderCache.set(elementId, source);
        
        return source;
    }

    /**
     * Load shader from external file (for future enhancement)
     */
    async loadShaderFromFile(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load shader: ${response.statusText}`);
            }
            
            const source = await response.text();
            
            // Cache with URL as key
            this.shaderCache.set(url, source);
            
            return source;
            
        } catch (error) {
            throw new Error(`Failed to load shader from ${url}: ${error.message}`);
        }
    }

    /**
     * Add common shader defines/macros
     */
    addDefines(source, defines = {}) {
        let result = source;
        
        // Add defines at the top (after #version if present)
        const defineLines = Object.entries(defines)
            .map(([key, value]) => `#define ${key} ${value}`)
            .join('\n');
        
        if (defineLines) {
            // Find #version line if it exists
            const versionMatch = result.match(/^#version\s+\d+.*$/m);
            if (versionMatch) {
                const versionLine = versionMatch[0];
                result = result.replace(versionLine, `${versionLine}\n${defineLines}`);
            } else {
                result = `${defineLines}\n${result}`;
            }
        }
        
        return result;
    }

    /**
     * Validate shader source for common issues
     */
    validateShaderSource(source, type) {
        const issues = [];
        
        // Check for main function
        if (!source.includes('void main(')) {
            issues.push('Missing main function');
        }
        
        // Type-specific validation
        if (type === 'vertex') {
            if (!source.includes('gl_Position')) {
                issues.push('Vertex shader missing gl_Position assignment');
            }
        } else if (type === 'fragment') {
            if (!source.includes('gl_FragColor') && !source.includes('gl_FragData')) {
                issues.push('Fragment shader missing gl_FragColor or gl_FragData assignment');
            }
        }
        
        // Check for common precision issues
        if (type === 'fragment' && !source.includes('precision')) {
            issues.push('Fragment shader missing precision qualifier (may cause issues on mobile)');
        }
        
        return issues;
    }

    /**
     * Get all available shaders from DOM
     */
    getAvailableShaders() {
        const shaderElements = document.querySelectorAll('script[type*="shader"]');
        const shaders = [];
        
        shaderElements.forEach(element => {
            const type = element.type.includes('vertex') ? 'vertex' : 'fragment';
            shaders.push({
                id: element.id,
                type: type,
                source: element.textContent.trim()
            });
        });
        
        return shaders;
    }

    /**
     * Create a shader pair object
     */
    createShaderPair(vertexId, fragmentId) {
        return {
            vertex: this.getShaderSource(vertexId),
            fragment: this.getShaderSource(fragmentId)
        };
    }

    /**
     * Preprocess shader source (remove comments, normalize whitespace)
     */
    preprocessShader(source) {
        return source
            // Remove single-line comments
            .replace(/\/\/.*$/gm, '')
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Clear shader cache
     */
    clearCache() {
        this.shaderCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.shaderCache.size,
            keys: Array.from(this.shaderCache.keys())
        };
    }
}
