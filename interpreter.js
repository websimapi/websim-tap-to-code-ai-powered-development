export class TapInterpreter {
    constructor() {
        this.patterns = {
            single: { clicks: 1, type: 'single', action: 'create' },
            double: { clicks: 2, type: 'double', action: 'modify' },
            triple: { clicks: 3, type: 'triple', action: 'delete' },
            quadruple: { clicks: 4, type: 'quadruple', action: 'complex' },
            spiral: { type: 'spiral', action: 'animate' },
            line: { type: 'line', action: 'connect' },
            circle: { type: 'circle', action: 'loop' }
        };
    }
    
    interpret(pattern, project) {
        // Enhanced interpretation with better user input understanding
        const clickCount = pattern.clicks?.length || 0;
        
        if (clickCount === 0) {
            return { action: 'ask', type: 'start', project };
        }
        
        // Analyze spatial relationships
        const positions = pattern.clicks || [];
        const analysis = {
            count: clickCount,
            positions,
            spread: this.calculateSpread(positions),
            timing: this.analyzeTiming(pattern.clicks),
            shape: this.detectShape(positions),
            density: this.calculateDensity(positions)
        };
        
        // Create contextual interpretation
        return {
            action: 'create',
            type: this.determinePluginType(analysis),
            analysis,
            positions,
            project,
            clickCount
        };
    }
    
    calculateDistance(p1, p2) {
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + 
            Math.pow(p2.y - p1.y, 2)
        );
    }
    
    getCenter(points) {
        const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        return { x: avgX, y: avgY };
    }
    
    detectShape(points) {
        if (points.length < 3) return null;
        
        // Simple circle detection
        const center = this.getCenter(points);
        const radius = this.calculateDistance(center, points[0]);
        let isCircle = true;
        
        for (const point of points) {
            const dist = this.calculateDistance(center, point);
            if (Math.abs(dist - radius) > 20) {
                isCircle = false;
                break;
            }
        }
        
        if (isCircle) return 'circle';
        
        // Line detection
        const slope = (points[1].y - points[0].y) / (points[1].x - points[0].x);
        let isLine = true;
        
        for (let i = 2; i < points.length; i++) {
            const newSlope = (points[i].y - points[0].y) / (points[i].x - points[0].x);
            if (Math.abs(newSlope - slope) > 0.1) {
                isLine = false;
                break;
            }
        }
        
        if (isLine) return 'line';
        
        return null;
    }
    
    calculateSpread(positions) {
        if (positions.length < 2) return 0;
        const center = this.getCenter(positions);
        return positions.reduce((sum, p) => 
            sum + Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2)), 0
        ) / positions.length;
    }
    
    calculateDensity(positions) {
        if (positions.length < 2) return 0;
        const bounds = this.getBounds(positions);
        const area = bounds.width * bounds.height;
        return positions.length / Math.max(area, 1);
    }
    
    getBounds(positions) {
        const x = positions.map(p => p.x);
        const y = positions.map(p => p.y);
        return {
            minX: Math.min(...x),
            maxX: Math.max(...x),
            minY: Math.min(...y),
            maxY: Math.max(...y),
            width: Math.max(...x) - Math.min(...x),
            height: Math.max(...y) - Math.min(...y)
        };
    }
    
    analyzeTiming(clicks) {
        if (clicks.length < 2) return { rhythm: 'single', speed: 0 };
        const intervals = [];
        for (let i = 1; i < clicks.length; i++) {
            intervals.push(clicks[i].timestamp - clicks[i-1].timestamp);
        }
        const avg = intervals.reduce((a,b) => a + b) / intervals.length;
        return {
            rhythm: avg < 200 ? 'rapid' : avg < 500 ? 'normal' : 'slow',
            speed: avg,
            intervals
        };
    }
    
    determinePluginType(analysis) {
        const { count, spread, shape, density } = analysis;
        
        if (count === 1) return 'interactive-element';
        if (count === 2) return 'connection-system';
        if (count === 3) return 'triangle-formation';
        if (shape === 'circle') return 'orbital-system';
        if (shape === 'line') return 'pathway';
        if (density > 0.01) return 'clustered-system';
        if (spread > 200) return 'distributed-system';
        
        return 'multi-point-system';
    }
}