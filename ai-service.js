export class AIService {
    constructor() {
        this.models = {
            'gpt-4': 'gpt-4',
            'claude': 'claude-3-sonnet'
        };
        this.isRealAI = navigator.onLine; // Check if we can make real API calls
    }
    
    async generateCode(interpretation) {
        try {
            // Show we're working
            this.showProgress(true);
            
            if (this.isRealAI) {
                return await this.generateWithAI(interpretation);
            } else {
                return await this.generateWithMockAI(interpretation);
            }
        } catch (error) {
            console.error('AI generation failed:', error);
            return {
                success: false,
                error: error.message,
                fallback: await this.generateWithMockAI(interpretation)
            };
        } finally {
            this.showProgress(false);
        }
    }
    
    async generateWithAI(interpretation) {
        const prompt = this.buildPrompt(interpretation);
        
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI pair programmer who responds to ANY user input, even single clicks.
Generate working code based on the number and position of user taps/clicks.

Rules:
1. Respond to ANY number of clicks (1, 2, 3+)
2. Create interactive web elements at the tap positions
3. Make elements that respond to user interaction
4. Include JavaScript that makes the page come alive
5. Even single clicks should create something useful

Respond with JSON: {"success": true, "project": {"files": {"index.html": "...", "styles.css": "...", "script.js": "..."}}}`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            json: true
        });
        
        return JSON.parse(completion.content);
    }
    
    async generateWithMockAI(interpretation) {
        const { positions, clickCount } = interpretation;
        
        let html = '', css = '', js = '';
        
        if (clickCount === 1) {
            // Single click - immediately create something
            html = `<button class="magic-btn" style="left:${positions[0].x}px; top:${positions[0].y}px;">✨ Magic</button>`;
            css = `
.magic-btn {
    position: absolute;
    padding: 15px 25px;
    background: linear-gradient(45deg, #ff006e, #00ff88);
    border: none;
    border-radius: 30px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
}
.magic-btn:hover {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
}`;
            js = `
document.querySelector('.magic-btn').addEventListener('click', (e) => {
    e.target.style.background = \`linear-gradient(45deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})\`;
    e.target.textContent = '✨ ' + ['Amazing!', 'Cool!', 'Wow!', 'Nice!'][Math.floor(Math.random()*4)];
});`;
        } else if (clickCount === 2) {
            // Two clicks - create a connection
            html = `<div class="connection-line"></div>`;
            css = `
.connection-line {
    position: absolute;
    left: ${positions[0].x}px;
    top: ${positions[0].y}px;
    width: ${Math.sqrt(Math.pow(positions[1].x - positions[0].x, 2) + Math.pow(positions[1].y - positions[0].y, 2))}px;
    height: 3px;
    background: linear-gradient(90deg, #00ff88, #ff006e);
    transform: rotate(${Math.atan2(positions[1].y - positions[0].y, positions[1].x - positions[0].x)}rad);
    transform-origin: 0 50%;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
}`;
            js = `// Connection line created between points`;
        } else {
            // 3+ clicks - create a shape
            const points = positions.map(p => `${p.x}px ${p.y}px`).join(', ');
            html = `<div class="user-shape"></div>`;
            css = `
.user-shape {
    position: absolute;
    width: 0;
    height: 0;
    border: 2px solid #00ff88;
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
    ${positions.length === 3 ? `clip-path: polygon(${points});` : ''}
    background: rgba(0, 255, 136, 0.1);
    animation: glow 3s infinite alternate;
}
@keyframes glow {
    from { filter: brightness(1); }
    to { filter: brightness(1.5); }
}`;
            js = `
// Interactive shape created from user clicks
document.querySelector('.user-shape').addEventListener('click', () => {
    this.style.transform = 'scale(1.2)';
    setTimeout(() => this.style.transform = 'scale(1)', 300);
});`;
        }
        
        return {
            success: true,
            project: {
                files: {
                    "index.html": html,
                    "styles.css": css,
                    "script.js": js
                }
            }
        };
    }
    
    buildPrompt(interpretation) {
        const { positions, clickCount } = interpretation;
        
        if (clickCount === 1) {
            return `User clicked at position (${positions[0].x}, ${positions[0].y}). Create an interactive button or element at this exact position.`;
        } else if (clickCount === 2) {
            return `User clicked at two positions: (${positions[0].x}, ${positions[0].y}) and (${positions[1].x}, ${positions[1].y}). Create something that connects or relates these two points.`;
        } else {
            return `User clicked ${clickCount} times at positions: ${JSON.stringify(positions)}. Create an interactive drawing or shape using these points.`;
        }
    }
    
    showProgress(show = true) {
        const progressBar = document.getElementById('progress-bar');
        if (show) {
            progressBar.style.display = 'block';
            progressBar.style.setProperty('--progress', '0%');
        } else {
            progressBar.style.setProperty('--progress', '100%');
            setTimeout(() => progressBar.style.display = 'none', 300);
        }
    }
}