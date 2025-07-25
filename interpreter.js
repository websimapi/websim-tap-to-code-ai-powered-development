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
        const recentClicks = pattern.clicks;
        
        // Detect basic patterns
        if (recentClicks.length === 1) {
            return {
                action: 'create',
                type: 'file',
                position: recentClicks[0],
                project
            };
        }
        
        if (recentClicks.length === 2) {
            const distance = this.calculateDistance(
                recentClicks[0], 
                recentClicks[1]
            );
            
            if (distance < 50) {
                return {
                    action: 'create',
                    type: 'component',
                    position: this.getCenter(recentClicks),
                    project
                };
            } else {
                return {
                    action: 'connect',
                    type: 'link',
                    from: recentClicks[0],
                    to: recentClicks[1],
                    project
                };
            }
        }
        
        // Detect shapes
        const shape = this.detectShape(recentClicks);
        if (shape) {
            return {
                action: 'create',
                type: shape,
                positions: recentClicks,
                project
            };
        }
        
        return {
            action: 'ask',
            type: 'clarify',
            positions: recentClicks,
            project
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

