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
        
        // Better interpretation of user input
        const patterns = {
            single: clickCount === 1,
            double: clickCount === 2,
            triangle: clickCount === 3,
            polygon: clickCount >= 4,
            line: this.isLinear(positions),
            cluster: this.isCluster(positions),
            spiral: this.isSpiralPattern(positions)
        };
        
        // Decide action based on pattern and context
        const shouldModify = recentPlugin && 
                           clickCount === 1 && 
                           Date.now() - recentPlugin.timestamp < 5000;
        
        if (shouldModify) {
            return this.modifyExistingPlugin(recentPlugin, positions[0]);
        } else {
            return this.createNewPlugin(interpretation, patterns);
        }
    }
    
    isLinear(positions) {
        if (positions.length < 2) return false;
        const dx = positions[1].x - positions[0].x;
        const dy = positions[1].y - positions[0].y;
        const slope = dy / dx;
        
        return positions.slice(2).every((p, i) => {
            const newSlope = (p.y - positions[0].y) / (p.x - positions[0].x);
            return Math.abs(newSlope - slope) < 0.2;
        });
    }
    
    isCluster(positions) {
        if (positions.length < 3) return false;
        const center = this.getCenter(positions);
        const avgDist = positions.reduce((sum, p) => 
            sum + Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2)), 0
        ) / positions.length;
        return avgDist < 50;
    }
    
    isSpiralPattern(positions) {
        if (positions.length < 4) return false;
        const center = this.getCenter(positions);
        const angles = positions.map(p => 
            Math.atan2(p.y - center.y, p.x - center.x)
        );
        
        let prevAngle = angles[0];
        for (let i = 1; i < angles.length; i++) {
            const angleDiff = angles[i] - prevAngle;
            if (Math.abs(angleDiff) > Math.PI / 3) return true;
            prevAngle = angles[i];
        }
        return false;
    }
    
    getCenter(positions) {
        return {
            x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
            y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length
        };
    }
    
    createNewPlugin(interpretation, patterns) {
        const { positions, clickCount } = interpretation;
        
        // Generate themed plugins based on patterns
        if (patterns.single) {
            return this.createSingleClickPlugin(positions[0]);
        } else if (patterns.double) {
            return this.createDoubleClickPlugin(positions);
        } else if (patterns.triangle) {
            return this.createTrianglePlugin(positions);
        } else if (patterns.polygon) {
            return this.createPolygonPlugin(positions);
        } else if (patterns.line) {
            return this.createLinePlugin(positions);
        } else if (patterns.cluster) {
            return this.createClusterPlugin(positions);
        } else {
            return this.createInteractivePlugin(positions);
        }
    }
    
    createSingleClickPlugin(position) {
        const elementId = `element-${Date.now()}`;
        return {
            success: true,
            action: 'create',
            project: {
                files: {
                    "index.html": `<div id="${elementId}" class="single-click-element" style="position:absolute; left:${position.x}px; top:${position.y}px; transform:translate(-50%,-50%);">
                        <div class="core">
                            <div class="orb"></div>
                            <div class="glow"></div>
                        </div>
                        <div class="info">
                            <span class="emoji">🎯</span>
                            <span class="label">Tap Me</span>
                        </div>
                    </div>`,
                    "styles.css": `
.single-click-element {
    width: 120px;
    height: 120px;
    cursor: pointer;
    transition: all 0.3s ease;
}
.core {
    position: relative;
    width: 100%;
    height: 100%;
}
.orb {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 30px rgba(102, 126, 234, 0.6);
    animation: pulse 2s ease-in-out infinite;
}
.glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80px;
    height: 80px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: rotate 4s linear infinite;
}
.info {
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: white;
    font-size: 12px;
}
.emoji {
    display: block;
    font-size: 20px;
    margin-bottom: 4px;
}
@keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
}
@keyframes rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}
.single-click-element:hover .orb {
    box-shadow: 0 0 50px rgba(102, 126, 234, 0.8);
}`,
                    "script.js": `
const element = document.getElementById('${elementId}');
let clicks = 0;
const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

element.addEventListener('click', (e) => {
    clicks++;
    const orb = element.querySelector('.orb');
    const newColor = colors[clicks % colors.length];
    
    orb.style.background = \`linear-gradient(135deg, \${newColor} 0%, \${colors[(clicks + 1) % colors.length]} 100%)\`;
    orb.style.boxShadow = \`0 0 30px \${newColor}99\`;
    
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.style.cssText = \`
        position: absolute;
        width: 10px;
        height: 10px;
        background: \${newColor}80;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: ripple 0.6s ease-out;
    \`;
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    
    element.querySelector('.label').textContent = \`Clicks: \${clicks}\`;
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = \`
@keyframes ripple {
    to {
        width: 150px;
        height: 150px;
        opacity: 0;
    }
}\`;
document.head.appendChild(style);`
                }
            }
        };
    }
    
    createDoubleClickPlugin(positions) {
        const [p1, p2] = positions;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        
        const pluginId = `double-${Date.now()}`;
        return {
            success: true,
            action: 'create',
            project: {
                files: {
                    "index.html": `<div id="${pluginId}" class="double-connection" style="position:absolute; left:0; top:0; width:100%; height:100%;">
                        <svg class="connection-svg" style="position:absolute; left:0; top:0; width:100%; height:100%;">
                            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                                  class="connection-line" />
                            <circle cx="${p1.x}" cy="${p1.y}" r="8" class="node node-1" />
                            <circle cx="${p2.x}" cy="${p2.y}" r="8" class="node node-2" />
                        </svg>
                        <div class="energy-beam" style="position:absolute; left:${midX}px; top:${midY}px; 
                             transform:translate(-50%,-50%);">
                            <div class="beam-core"></div>
                            <div class="beam-particles"></div>
                        </div>
                    </div>`,
                    "styles.css": `
.double-connection {
    pointer-events: none;
}
.connection-svg {
    z-index: 1;
}
.connection-line {
    stroke: #00ff88;
    stroke-width: 2;
    stroke-dasharray: 5,5;
    animation: dash 2s linear infinite;
}
.node {
    fill: #00ff88;
    stroke: #00ff88;
    stroke-width: 2;
    cursor: pointer;
    transition: all 0.3s ease;
}
.node:hover {
    r: 12;
    fill: #fff;
}
@keyframes dash {
    to { stroke-dashoffset: -10; }
}
.energy-beam {
    width: 30px;
    height: 30px;
    pointer-events: auto;
    cursor: pointer;
}
.beam-core {
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, #00ff88, transparent);
    border-radius: 50%;
    animation: beamPulse 1.5s ease-in-out infinite;
}
@keyframes beamPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.7; }
}
.beam-particles {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
}
.beam-particles::before,
.beam-particles::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background: #00ff88;
    border-radius: 50%;
    animation: particleFloat 2s ease-in-out infinite;
}
.beam-particles::before {
    animation-delay: 0s;
}
.beam-particles::after {
    animation-delay: 1s;
}
@keyframes particleFloat {
    0%, 100% { transform: translate(0, 0); opacity: 0; }
    50% { transform: translate(${Math.cos(Math.atan2(p2.y - p1.y, p2.x - p1.x)) * 50}px, ${Math.sin(Math.atan2(p2.y - p1.y, p2.x - p1.x)) * 50}px); opacity: 1; }
}`,
                    "script.js": `
const plugin = document.getElementById('${pluginId}');
const nodes = plugin.querySelectorAll('.node');
const beam = plugin.querySelector('.energy-beam');
let energy = 0;

nodes.forEach(node => {
    node.addEventListener('click', (e) => {
        e.stopPropagation();
        energy += 10;
        updateEnergy();
    });
});

beam.addEventListener('click', () => {
    if (energy > 0) {
        energy = Math.max(0, energy - 5);
        burstEnergy();
        updateEnergy();
    }
});

function updateEnergy() {
    const intensity = Math.min(energy / 50, 1);
    beam.style.transform = \`translate(-50%, -50%) scale(\${1 + intensity})\`;
}

function burstEnergy() {
    const burst = document.createElement('div');
    burst.className = 'energy-burst';
    burst.style.cssText = \`
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, #00ff88, transparent);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: burst 0.5s ease-out forwards;
        pointer-events: none;
    \`;
    beam.appendChild(burst);
    setTimeout(() => burst.remove(), 500);
}

const style = document.createElement('style');
style.textContent = \`
@keyframes burst {
    to {
        transform: translate(-50%, -50%) scale(3);
        opacity: 0;
    }
}\`;
document.head.appendChild(style);`
                }
            }
        };
    }
    
    modifyExistingPlugin(recentPlugin, newPosition) {
        const { code } = recentPlugin;
        const elementId = 'modified-' + Date.now();
        
        // Parse existing HTML to add new element
        const existingHTML = code.files['index.html'] || '';
        const newElement = `<div id="${elementId}" class="added-element" style="position:absolute; left:${newPosition.x}px; top:${newPosition.y}px; transform:translate(-50%,-50%);">
            <div class="mini-orb"></div>
        </div>`;
        
        const newHTML = existingHTML + newElement;
        
        // Update styles
        const newCSS = (code.files['styles.css'] || '') + `
.added-element {
    width: 30px;
    height: 30px;
    cursor: pointer;
    z-index: 100;
}
.mini-orb {
    width: 100%;
    height: 100%;
    background: #ff6b6b;
    border-radius: 50%;
    animation: miniPulse 1s ease-in-out infinite;
}
@keyframes miniPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}
.added-element:hover .mini-orb {
    background: #ff4757;
}
`;
        
        // Update scripts
        const newJS = (code.files['script.js'] || '') + `
const miniElement = document.getElementById('${elementId}');
miniElement.addEventListener('click', () => {
    miniElement.style.transform = 'translate(-50%, -50%) scale(1.5)';
    setTimeout(() => {
        miniElement.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 200);
});`;
        
        return {
            success: true,
            action: 'modify',
            targetPlugin: recentPlugin.id,
            project: {
                files: {
                    "index.html": newHTML,
                    "styles.css": newCSS,
                    "script.js": newJS
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