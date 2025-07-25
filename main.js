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
        const pattern = this.patterns.detect(this.clicks);
        
        if (pattern) {
            this.showPatternRecognition(pattern);
            this.status.textContent = `Pattern detected: ${pattern.type}`;
            await this.interpretPattern(pattern);
        } else {
            this.status.textContent = `${this.clicks.length} points - Keep clicking or press space to reset`;
        }
    }
    
    showPatternRecognition(pattern) {
        const effect = document.createElement('div');
        effect.className = 'pattern-recognition';
        effect.style.left = pattern.centerX + 'px';
        effect.style.top = pattern.centerY + 'px';
        
        // Add label
        const label = document.createElement('div');
        label.textContent = pattern.type;
        label.style.position = 'absolute';
        label.style.left = '50%';
        label.style.top = '50%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.color = '#00ff88';
        label.style.fontSize = '14px';
        effect.appendChild(label);
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 2000);
    }
    
    async interpretPattern(pattern) {
        try {
            const interpretation = await this.interpreter.interpret(pattern, this.currentProject);
            
            if (interpretation.action) {
                await this.executeAction(interpretation);
            }
        } catch (error) {
            this.status.textContent = 'Error interpreting pattern - Try again';
            this.clicks = [];
        }
    }
    
    async executeAction(interpretation) {
        this.status.textContent = 'Generating code...';
        
        try {
            const result = await this.ai.generateCode(interpretation);
            
            if (result.success) {
                this.currentProject = result.project;
                this.renderer.render(result.project);
                this.status.textContent = 'Code generated! Tap for new pattern';
                this.showCodePanel();
                this.clicks = [];
            } else if (result.fallback) {
                // Use the fallback
                this.currentProject = result.fallback.project;
                this.renderer.render(result.fallback);
                this.status.textContent = 'Demo mode - Working offline';
                this.showCodePanel();
                this.clicks = [];
            } else {
                throw new Error('Generation failed');
            }
        } catch (error) {
            console.error('Action failed:', error);
            this.status.textContent = 'Try different pattern';
            this.clicks = [];
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