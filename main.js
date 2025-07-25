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
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const clickEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleClick(clickEvent);
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
        
        this.analyzePattern();
    }
    
    createClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = x - 10 + 'px';
        effect.style.top = y - 10 + 'px';
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 600);
    }
    
    analyzePattern() {
        const pattern = this.patterns.detect(this.clicks);
        
        if (pattern) {
            this.showPatternRecognition(pattern);
            this.interpretPattern(pattern);
        }
    }
    
    showPatternRecognition(pattern) {
        const effect = document.createElement('div');
        effect.className = 'pattern-recognition';
        effect.style.left = pattern.centerX - 50 + 'px';
        effect.style.top = pattern.centerY - 50 + 'px';
        effect.style.width = '100px';
        effect.style.height = '100px';
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    }
    
    async interpretPattern(pattern) {
        this.status.textContent = 'Interpreting...';
        
        const interpretation = await this.interpreter.interpret(pattern, this.currentProject);
        
        if (interpretation.action) {
            await this.executeAction(interpretation);
        }
    }
    
    async executeAction(interpretation) {
        this.status.textContent = 'AI thinking...';
        
        const result = await this.ai.generateCode(interpretation);
        
        if (result.success) {
            this.currentProject = result.project;
            this.renderer.render(result.project);
            this.status.textContent = 'Code generated!';
            this.showCodePanel();
        } else {
            this.status.textContent = 'Try again...';
        }
        
        // Clean up old clicks
        this.clicks = [];
    }
    
    showCodePanel() {
        const panel = document.getElementById('code-panel');
        panel.style.display = 'flex';
    }
    
    startListening() {
        this.isListening = true;
        this.status.textContent = 'Tap to code...';
    }
}

// Initialize
new TapToCode();

