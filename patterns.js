export class PatternTracker {
    constructor() {
        this.patterns = [];
        this.timeout = 2000; // 2 second window
    }
    
    detect(clicks) {
        if (clicks.length === 0) return null;
        
        const recentClicks = this.getRecentClicks(clicks);
        
        return {
            type: this.getPatternType(recentClicks),
            clicks: recentClicks,
            centerX: this.getCenterX(recentClicks),
            centerY: this.getCenterY(recentClicks),
            velocity: this.getVelocity(recentClicks),
            direction: this.getDirection(recentClicks)
        };
    }
    
    getRecentClicks(clicks) {
        const now = Date.now();
        return clicks.filter(c => now - c.timestamp < this.timeout);
    }
    
    getPatternType(clicks) {
        if (clicks.length === 1) return 'single';
        if (clicks.length === 2) return 'double';
        if (clicks.length === 3) return 'triple';
        if (clicks.length === 4) return 'quadruple';
        
        // More complex patterns
        if (this.isSpiral(clicks)) return 'spiral';
        if (this.isCircle(clicks)) return 'circle';
        if (this.isLine(clicks)) return 'line';
        
        return 'complex';
    }
    
    getCenterX(clicks) {
        return clicks.reduce((sum, c) => sum + c.x, 0) / clicks.length;
    }
    
    getCenterY(clicks) {
        return clicks.reduce((sum, c) => sum + c.y, 0) / clicks.length;
    }
    
    getVelocity(clicks) {
        if (clicks.length < 2) return 0;
        
        const totalDistance = clicks.reduce((sum, c, i) => {
            if (i === 0) return 0;
            const prev = clicks[i - 1];
            const distance = Math.sqrt(
                Math.pow(c.x - prev.x, 2) + 
                Math.pow(c.y - prev.y, 2)
            );
            return sum + distance;
        }, 0);
        
        const timeSpan = clicks[clicks.length - 1].timestamp - clicks[0].timestamp;
        return totalDistance / timeSpan;
    }
    
    getDirection(clicks) {
        if (clicks.length < 2) return 0;
        
        const first = clicks[0];
        const last = clicks[clicks.length - 1];
        
        return Math.atan2(last.y - first.y, last.x - first.x);
    }
    
    isSpiral(clicks) {
        if (clicks.length < 5) return false;
        
        const centerX = this.getCenterX(clicks);
        const centerY = this.getCenterY(clicks);
        
        let prevAngle = null;
        let spiralCount = 0;
        
        for (let i = 1; i < clicks.length; i++) {
            const angle = Math.atan2(
                clicks[i].y - centerY,
                clicks[i].x - centerX
            );
            
            if (prevAngle !== null) {
                const angleDiff = angle - prevAngle;
                if (Math.abs(angleDiff) > Math.PI / 4) {
                    spiralCount++;
                }
            }
            
            prevAngle = angle;
        }
        
        return spiralCount > 3;
    }
    
    isCircle(clicks) {
        if (clicks.length < 3) return false;
        
        const centerX = this.getCenterX(clicks);
        const centerY = this.getCenterY(clicks);
        
        const radius = Math.sqrt(
            Math.pow(clicks[0].x - centerX, 2) + 
            Math.pow(clicks[0].y - centerY, 2)
        );
        
        const tolerance = radius * 0.2;
        
        return clicks.every(c => {
            const dist = Math.sqrt(
                Math.pow(c.x - centerX, 2) + 
                Math.pow(c.y - centerY, 2)
            );
            return Math.abs(dist - radius) < tolerance;
        });
    }
    
    isLine(clicks) {
        if (clicks.length < 3) return false;
        
        const slope = (clicks[1].y - clicks[0].y) / (clicks[1].x - clicks[0].x);
        const tolerance = 0.1;
        
        return clicks.slice(2).every((c, i) => {
            const newSlope = (c.y - clicks[0].y) / (c.x - clicks[0].x);
            return Math.abs(newSlope - slope) < tolerance;
        });
    }
}

