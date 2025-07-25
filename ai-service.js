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
                    content: `You are an AI pair programmer. Generate clean, modern web code based on user interactions.
Focus on creating small, functional parts that can be built upon. Keep it simple and educational.

For a basic interaction, generate HTML/CSS/JS that creates a visual element at the interaction position.
For multiple clicks, create components that show the relationship between those points.

Respond with a JSON object containing only:
{
  "success": true,
  "project": {
    "files": {
      "index.html": "<html_content>",
      "styles.css": "<css_content>",
      "script.js": "<js_content>"
    }
  }
}`
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
        // Fallback demo generation
        const { action, type, positions } = interpretation;
        
        let html = '', css = '', js = '';
        
        if (positions.length === 1) {
            // Single click - create a button
            html = `
<div class="interactive-button">
    <button class="demo-btn">Click me!</button>
</div>`;
            css = `
.interactive-button {
    position: absolute;
    left: ${positions[0].x}px;
    top: ${positions[0].y}px;
}
.demo-btn {
    padding: 15px 30px;
    background: linear-gradient(135deg, #00ff88, #0066ff);
    border: none;
    border-radius: 25px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
}
.demo-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
}`;
            js = `
document.querySelector('.demo-btn').addEventListener('click', () => {
    alert('Hello from your tap-to-code demo!');
});`;
        } else if (positions.length === 2) {
            // Double click - connect with a line
            html = `<canvas id="demo-canvas" width="${window.innerWidth}" height="${window.innerHeight}"></canvas>`;
            css = `#demo-canvas { position: absolute; top: 0; left: 0; }`;
            js = `
const canvas = document.getElementById('demo-canvas');
const ctx = canvas.getContext('2d');
ctx.strokeStyle = '#00ff88';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(${positions[0].x}, ${positions[0].y});
ctx.lineTo(${positions[1].x}, ${positions[1].y});
ctx.stroke();

// Add glowing effect
ctx.shadowBlur = 10;
ctx.shadowColor = '#00ff88';
ctx.stroke();`;
        } else if (positions.length >= 3) {
            // Multiple clicks - create a polygon
            html = `<canvas id="polygon-canvas" width="${window.innerWidth}" height="${window.innerHeight}"></canvas>`;
            css = `#polygon-canvas { position: absolute; top: 0; left: 0; }`;
            js = `
const canvas = document.getElementById('polygon-canvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
ctx.strokeStyle = '#00ff88';
ctx.lineWidth = 2;

ctx.beginPath();
const points = ${JSON.stringify(positions)};
ctx.moveTo(points[0].x, points[0].y);
points.forEach(p => ctx.lineTo(p.x, p.y));
ctx.closePath();

ctx.fill();
ctx.stroke();`;
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
        const { action, type, positions } = interpretation;
        return `User ${action} action with ${positions.length} clicks at ${JSON.stringify(positions)}. Create engaging web content`;
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