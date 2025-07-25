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
            // Single click - immediately create something interactive
            html = `<div class="interactive-btn" id="btn-${Date.now()}" style="position:absolute; left:${positions[0].x}px; top:${positions[0].y}px;">
                <button>Click Me!</button>
            </div>`;
            
            css = `
.interactive-btn {
    position: absolute;
    transform: translate(-50%, -50%);
}
.interactive-btn button {
    padding: 15px 30px;
    background: linear-gradient(45deg, #00ff88, #0099ff);
    border: none;
    border-radius: 25px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.4);
}
.interactive-btn button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(0, 255, 136, 0.6);
}`;
            
            js = `
const btn = document.querySelector('#btn-${Date.now()} button');
let clickCount = 0;
btn.addEventListener('click', () => {
    clickCount++;
    btn.textContent = \`Clicked \${clickCount} times!\`;
    btn.style.background = \`linear-gradient(45deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})\`;
    
    if (clickCount % 5 === 0) {
        btn.textContent = '🎉 WOW!';
        setTimeout(() => btn.textContent = 'Click Me!', 1000);
    }
});`;
        } else if (clickCount === 2) {
            // Two clicks - create a draggable line
            html = `<svg class="dynamic-line" style="position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;">
                <line x1="${positions[0].x}" y1="${positions[0].y}" 
                      x2="${positions[1].x}" y2="${positions[1].y}" 
                      stroke="#00ff88" stroke-width="3" />
            </svg>`;
            
            css = `
.dynamic-line line {
    stroke-dasharray: 5;
    animation: dash 2s linear infinite;
}
@keyframes dash {
    to { stroke-dashoffset: -10; }
}`;
            
            js = `
const line = document.querySelector('.dynamic-line line');
let offset = 0;
setInterval(() => {
    offset += 0.5;
    const x1 = parseFloat(line.getAttribute('x1'));
    const y1 = parseFloat(line.getAttribute('y1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y2 = parseFloat(line.getAttribute('y2'));
    
    line.setAttribute('x2', x2 + Math.sin(offset) * 10);
    line.setAttribute('y2', y2 + Math.cos(offset) * 10);
}, 50);`;
        } else {
            // 3+ clicks - create a dynamic shape
            const points = positions.map(p => `${p.x},${p.y}`).join(' ');
            html = `<polygon class="user-polygon" points="${points}" style="position:absolute; left:0; top:0;" />`;
            
            css = `
.user-polygon {
    fill: rgba(0, 255, 136, 0.2);
    stroke: #00ff88;
    stroke-width: 2;
    transition: all 0.3s ease;
    cursor: pointer;
}
.user-polygon:hover {
    fill: rgba(0, 255, 136, 0.4);
    stroke: #fff;
}`;
            
            js = `
const polygon = document.querySelector('.user-polygon');
let scale = 1;
polygon.addEventListener('click', () => {
    scale = scale === 1 ? 1.2 : 1;
    polygon.style.transform = \`scale(\${scale})\`;
    polygon.style.transformOrigin = 'center';
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