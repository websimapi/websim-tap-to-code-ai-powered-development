export class AIService {
    constructor() {
        this.models = {
            'gpt-4': 'gpt-4',
            'claude': 'claude-3-sonnet'
        };
        this.isRealAI = navigator.onLine;
    }
    
    async generateCode(interpretation) {
        try {
            // Show we're working
            this.showProgress(true);
            
            // Get context about existing plugins
            const pluginContext = this.getPluginContext();
            
            if (this.isRealAI) {
                return await this.generateWithAI(interpretation, pluginContext);
            } else {
                return await this.generateWithMockAI(interpretation, pluginContext);
            }
        } catch (error) {
            console.error('AI generation failed:', error);
            return {
                success: false,
                error: error.message,
                fallback: await this.generateWithMockAI(interpretation, this.getPluginContext())
            };
        } finally {
            this.showProgress(false);
        }
    }
    
    getPluginContext() {
        if (!window.appPlugins) window.appPlugins = [];
        
        return {
            plugins: window.appPlugins.map(p => ({
                id: p.id,
                timestamp: p.timestamp,
                fileCount: Object.keys(p.code.files || {}).length,
                files: Object.keys(p.code.files || {})
            })),
            recentPlugin: window.appPlugins[window.appPlugins.length - 1] || null,
            totalPlugins: window.appPlugins.length
        };
    }
    
    async generateWithAI(interpretation, pluginContext) {
        const prompt = this.buildPromptWithContext(interpretation, pluginContext);
        
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI pair programmer who responds to user clicks by generating or modifying plugins.

IMPORTANT: You must provide context about existing plugins and intelligently decide whether to:
1. CREATE a new plugin
2. MODIFY an existing plugin
3. PATCH/UPDATE the most recent plugin

Plugin Context:
${JSON.stringify(pluginContext, null, 2)}

Rules:
- Single clicks: Create new elements or modify existing ones
- Multiple clicks: Create shapes or connections
- Always check if you should modify the most recent plugin vs creating new
- Include plugin management functions
- Make elements interactive and visually appealing

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
    
    async generateWithMockAI(interpretation, pluginContext) {
        const { positions, clickCount } = interpretation;
        const recentPlugin = pluginContext.recentPlugin;
        
        let html = '', css = '', js = '', action = 'create', targetPlugin = null;
        
        // Decide whether to modify existing or create new
        if (clickCount === 1 && recentPlugin) {
            // Modify existing plugin
            action = 'modify';
            targetPlugin = recentPlugin.id;
            
            html = recentPlugin.code.files['index.html'] || '';
            css = recentPlugin.code.files['styles.css'] || '';
            js = recentPlugin.code.files['script.js'] || '';
            
            // Add new element at click position
            const newElement = `<div class="new-element" id="element-${Date.now()}" 
                style="position:absolute; left:${positions[0].x}px; top:${positions[0].y}px; 
                width:50px; height:50px; background:radial-gradient(circle, #ff6b6b, #ff4757); 
                border-radius:50%; cursor:pointer; transform:translate(-50%,-50%); transition:all 0.3s;">
                <span style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); 
                color:white; font-weight:bold;">+</span>
            </div>`;
            
            html += newElement;
            
            js += `
const element${Date.now()} = document.getElementById('element-${Date.now()}');
element${Date.now()}.addEventListener('click', () => {
    element${Date.now()}.style.transform = 'translate(-50%, -50%) scale(1.2)';
    setTimeout(() => element${Date.now()}.style.transform = 'translate(-50%, -50%) scale(1)', 200);
});`;
            
        } else {
            // Create new plugin
            action = 'create';
            
            if (clickCount === 1) {
                html = `<div class="interactive-circle" id="circle-${Date.now()}" 
                    style="position:absolute; left:${positions[0].x}px; top:${positions[0].y}px; 
                    width:100px; height:100px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    border-radius:50%; cursor:pointer; transform:translate(-50%,-50%); 
                    box-shadow:0 10px 30px rgba(0,0,0,0.3); transition:all 0.3s;">
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); 
                    color:white; text-align:center;">
                        <div style="font-size:24px;">🎯</div>
                        <div style="font-size:12px;">Click Me!</div>
                    </div>
                </div>`;
                
                css = `
.interactive-circle {
    animation: float 3s ease-in-out infinite;
}
@keyframes float {
    0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
    50% { transform: translate(-50%, -50%) translateY(-10px); }
}
.interactive-circle:hover {
    transform: translate(-50%, -50%) scale(1.1);
}`;
                
                js = `
const circle = document.getElementById('circle-${Date.now()}');
let clicks = 0;
circle.addEventListener('click', () => {
    clicks++;
    circle.style.background = \`linear-gradient(135deg, hsl(\${clicks * 30}, 70%, 60%), hsl(\${clicks * 30 + 60}, 70%, 60%))\`;
    circle.querySelector('div').innerHTML = \`<div style="font-size:24px;">\${['🎯','🎨','🎪','🎭','🎪','🎨'][clicks % 6]}</div>
    <div style="font-size:12px;">Clicks: \${clicks}</div>\`;
});`;
            } else if (clickCount === 2) {
                const [p1, p2] = positions;
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                
                html = `<div class="connection-line" style="position:absolute; left:0; top:0; width:100%; height:100%;">
                    <svg style="position:absolute; left:0; top:0; width:100%; height:100%;">
                        <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                            stroke="#00ff88" stroke-width="4" stroke-dasharray="10,5" />
                    </svg>
                    <div class="connection-node" style="position:absolute; left:${midX}px; top:${midY}px; 
                        transform:translate(-50%,-50%); width:20px; height:20px; background:#00ff88; 
                        border-radius:50%; animation:pulse 2s infinite;"></div>
                </div>`;
                
                css = `
.connection-node {
    box-shadow: 0 0 20px rgba(0,255,136,0.8);
}
@keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}`;
                
                js = `
const node = document.querySelector('.connection-node');
node.addEventListener('click', () => {
    node.style.background = '#ff6b6b';
    setTimeout(() => node.style.background = '#00ff88', 1000);
});`;
            } else {
                // Create polygon from clicks
                const points = positions.map(p => `${p.x},${p.y}`).join(' ');
                const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
                const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
                
                html = `<div class="user-shape" style="position:absolute; left:0; top:0; width:100%; height:100%;">
                    <svg style="position:absolute; left:0; top:0; width:100%; height:100%;">
                        <polygon points="${points}" 
                            fill="rgba(0, 255, 136, 0.2)" 
                            stroke="#00ff88" 
                            stroke-width="2" />
                        <text x="${centerX}" y="${centerY}" 
                            text-anchor="middle" 
                            dominant-baseline="middle" 
                            fill="white" 
                            font-size="16">
                            ${positions.length} points
                        </text>
                    </svg>
                </div>`;
                
                css = `
.user-shape polygon {
    transition: all 0.3s ease;
    cursor: pointer;
}
.user-shape polygon:hover {
    fill: rgba(0, 255, 136, 0.4);
    stroke: #fff;
}`;
                
                js = `
const polygon = document.querySelector('.user-shape polygon');
let rotation = 0;
polygon.addEventListener('click', () => {
    rotation += 45;
    polygon.style.transformOrigin = '${centerX}px ${centerY}px';
    polygon.style.transform = \`rotate(\${rotation}deg)\`;
});`;
            }
        }
        
        return {
            success: true,
            action,
            targetPlugin,
            project: {
                files: {
                    "index.html": html,
                    "styles.css": css,
                    "script.js": js
                }
            }
        };
    }
    
    buildPromptWithContext(interpretation, pluginContext) {
        const { positions, clickCount } = interpretation;
        const pluginCount = pluginContext.totalPlugins;
        
        let prompt = `User provided ${clickCount} click(s) at positions: ${JSON.stringify(positions)}. `;
        
        if (pluginCount > 0) {
            prompt += `There are ${pluginCount} existing plugins. `;
            if (pluginContext.recentPlugin) {
                prompt += `Most recent plugin ${pluginContext.recentPlugin.id} has files: ${pluginContext.recentPlugin.files.join(', ')}. `;
                prompt += `Should you modify this existing plugin or create a new one? `;
            }
        }
        
        prompt += `Generate appropriate code based on the click pattern and existing plugin context.`;
        
        return prompt;
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