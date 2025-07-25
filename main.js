import { TapInterpreter } from './interpreter.js';
import { CodeRenderer } from './renderer.js';
import { PatternTracker } from './patterns.js';
import { AIService } from './ai-service.js';

class TapToCode {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('overlay');
        this.status = document.getElementById('status');
        
        this.interpreter = new TapInterpreter();
        this.renderer = new CodeRenderer();
        this.patterns = new PatternTracker();
        this.ai = new AIService();
        
        this.clicks = [];
        this.isListening = false;
        this.currentProject = {
            files: {},
            structure: {}
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.startListening();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // Updated with better feedback
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // Touch support with better feedback
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const clickEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleClick(clickEvent);
        });
        
        // Spacebar to clear current pattern
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.clicks = [];
                this.status.textContent = 'Pattern cleared - Tap to code...';
            }
        });
        
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.createClickEffect(x, y);
        this.clicks.push({
            x, y, 
            timestamp: Date.now(),
            type: 'left'
        });
        
        // Show live feedback
        this.updatePatternIndicator();
        this.analyzePattern();
    }
    
    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.clicks.push({
            x, y, 
            timestamp: Date.now(),
            type: 'right'
        });
        
        this.updatePatternIndicator();
        this.analyzePattern();
    }
    
    createClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = (x - 10) + 'px';
        effect.style.top = (y - 10) + 'px';
        
        // Add position indicator
        const label = document.createElement('span');
        label.className = 'position-label';
        label.textContent = this.clicks.length + 1;
        label.style.position = 'absolute';
        label.style.left = '-10px';
        label.style.top = '-20px';
        label.style.color = '#00ff88';
        label.style.fontSize = '12px';
        
        effect.appendChild(label);
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    }
    
    updatePatternIndicator() {
        const indicator = document.getElementById('pattern-indicator');
        indicator.innerHTML = '';
        
        this.clicks.forEach((click, i) => {
            const dot = document.createElement('div');
            dot.className = 'pattern-dot active';
            dot.style.animationDelay = (i * 0.1) + 's';
            indicator.appendChild(dot);
        });
    }
    
    async analyzePattern() {
        // Remove strict pattern detection - respond to any clicks
        if (this.clicks.length === 0) return;
        
        // Always interpret, even with just 1 click
        this.status.textContent = `Processing ${this.clicks.length} points...`;
        
        // Create a simple pattern object with all clicks
        const pattern = {
            type: 'user-input',
            clicks: this.clicks,
            centerX: this.clicks.reduce((sum, c) => sum + c.x, 0) / this.clicks.length,
            centerY: this.clicks.reduce((sum, c) => sum + c.y, 0) / this.clicks.length
        };
        
        await this.interpretPattern(pattern);
    }
    
    async interpretPattern(pattern) {
        try {
            // Always send to AI - no pattern validation
            const interpretation = {
                action: 'create',
                type: 'interactive-element',
                positions: pattern.clicks,
                project: this.currentProject,
                clickCount: pattern.clicks.length
            };
            
            await this.executeAction(interpretation);
        } catch (error) {
            console.error('Interpretation error:', error);
            this.status.textContent = 'Generating response...';
            await this.executeAction({
                action: 'create',
                type: 'fallback-element',
                positions: this.clicks,
                project: this.currentProject,
                clickCount: this.clicks.length
            });
        }
    }
    
    async executeAction(interpretation) {
        try {
            this.showProgress(true);
            this.status.textContent = 'AI is thinking...';
            
            const result = await this.ai.generateCode(interpretation);
            
            if (result.success) {
                // Handle plugin creation/modification
                if (result.action === 'modify' && result.targetPlugin) {
                    // Update existing plugin
                    this.updatePlugin(result.targetPlugin, result.project);
                } else {
                    // Create new plugin
                    await this.executeGeneratedCode(result.project);
                }
                
                this.status.textContent = `Plugin ${result.action}d! Tap anywhere to continue...`;
                this.scheduleClickReset();
            }
        } catch (error) {
            console.error('Action failed:', error);
            this.status.textContent = 'Tap anywhere to start...';
            this.clicks = [];
        } finally {
            this.showProgress(false);
        }
    }

    async executeGeneratedCode(project, targetPlugin = null) {
        const pluginId = targetPlugin || 'plugin_' + Date.now();
        
        if (!window.appPlugins) window.appPlugins = [];
        
        // Store plugin with metadata
        const pluginData = {
            id: pluginId,
            code: project,
            timestamp: Date.now(),
            version: 1
        };
        
        if (targetPlugin) {
            // Update existing plugin
            const index = window.appPlugins.findIndex(p => p.id === targetPlugin);
            if (index !== -1) {
                window.appPlugins[index] = pluginData;
            }
        } else {
            // Add new plugin
            window.appPlugins.push(pluginData);
        }
        
        // Execute the plugin
        this.renderPlugin(pluginData);
        
        // Update the code panel
        this.currentProject = project;
        this.renderer.render(project);
        this.showCodePanel();
    }
    
    renderPlugin(pluginData) {
        const container = document.getElementById('plugin-container');
        
        // Remove existing plugin if modifying
        if (pluginData.id) {
            const existing = document.getElementById(pluginData.id);
            if (existing) existing.remove();
            
            const existingStyle = document.getElementById(pluginData.id + '_style');
            if (existingStyle) existingStyle.remove();
        }
        
        const { files } = pluginData.code;
        
        // Execute HTML
        if (files['index.html']) {
            const pluginDiv = document.createElement('div');
            pluginDiv.id = pluginData.id;
            pluginDiv.style.position = 'absolute';
            pluginDiv.style.top = '0';
            pluginDiv.style.left = '0';
            pluginDiv.style.width = '100%';
            pluginDiv.style.height = '100%';
            pluginDiv.style.pointerEvents = 'auto';
            pluginDiv.innerHTML = files['index.html'];
            container.appendChild(pluginDiv);
        }
        
        // Execute CSS
        if (files['styles.css']) {
            const style = document.createElement('style');
            style.id = pluginData.id + '_style';
            style.textContent = files['styles.css'];
            document.head.appendChild(style);
        }
        
        // Execute JavaScript
        if (files['script.js']) {
            try {
                const func = new Function('pluginId', 'clicks', 'project', files['script.js']);
                func.call(this, pluginData.id, this.clicks, pluginData.code);
            } catch (e) {
                console.error('Plugin execution error:', e);
            }
        }
    }
    
    // Enhanced plugin management
    removePlugin(pluginId) {
        const plugin = document.getElementById(pluginId);
        const style = document.getElementById(pluginId + '_style');
        
        if (plugin) plugin.remove();
        if (style) style.remove();
        
        window.appPlugins = window.appPlugins.filter(p => p.id !== pluginId);
    }
    
    listPlugins() {
        return window.appPlugins || [];
    }
    
    clearAllPlugins() {
        (window.appPlugins || []).forEach(plugin => {
            this.removePlugin(plugin.id);
        });
        window.appPlugins = [];
    }
    
    updatePlugin(pluginId, newProject) {
        this.removePlugin(pluginId);
        this.executeGeneratedCode(newProject);
    }
    
    scheduleClickReset() {
        clearTimeout(this.resetTimeout);
        this.resetTimeout = setTimeout(() => {
            this.clicks = [];
            this.status.textContent = 'Ready for new input - Tap anywhere...';
        }, 3000);
    }
    
    showProgress(show = true) {
        const progressBar = document.getElementById('progress-bar');
        const aiThinking = document.getElementById('ai-thinking');
        
        if (show) {
            progressBar.style.display = 'block';
            aiThinking.textContent = 'AI working...';
            
            // Animate progress
            let progress = 0;
            const animate = () => {
                progress += Math.random() * 15;
                if (progress < 90) {
                    progressBar.style.setProperty('--progress', progress + '%');
                    requestAnimationFrame(animate);
                }
            };
            animate();
        } else {
            progressBar.style.setProperty('--progress', '100%');
            aiThinking.textContent = 'AI listening...';
            setTimeout(() => {
                progressBar.style.display = 'none';
                progressBar.style.setProperty('--progress', '0%');
            }, 500);
        }
    }
    
    showCodePanel() {
        const panel = document.getElementById('code-panel');
        panel.style.display = 'flex';
        panel.style.animation = 'slideIn 0.3s ease-out';
    }
    
    startListening() {
        this.isListening = true;
        this.status.textContent = 'Tap anywhere to start coding...';
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(100px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

#progress-bar::after {
    content: '';
    display: block;
    height: 100%;
    background: var(--accent);
    width: var(--progress, 0%);
    transition: width 0.3s ease;
}

#progress-bar {
    width: 200px;
    height: 3px;
    background: #333;
    margin-top: 10px;
    border-radius: 3px;
    overflow: hidden;
    display: none;
}
`;
document.head.appendChild(style);

// Initialize
new TapToCode();