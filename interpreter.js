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
        // Always interpret - no pattern validation
        const clickCount = pattern.clicks?.length || 0;
        
        if (clickCount === 0) {
            return { action: 'ask', type: 'start', project };
        }
        
        // Always create something based on click count and positions
        return {
            action: 'create',
            type: clickCount === 1 ? 'single-element' :
                   clickCount === 2 ? 'connection' :
                   clickCount === 3 ? 'triangle' :
                   clickCount === 4 ? 'rectangle' : 'shape',
            positions: pattern.clicks || [],
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
}