/**
 * LaserPointer - Handles laser pointer functionality with trail effect
 */
export class LaserPointer {
  constructor(infiniteCanvas) {
    this.infiniteCanvas = infiniteCanvas;
    this.animationFrameId = null;
    this.isAnimating = false;
    
    // Trail-based system instead of segments
    this.trailDuration = 600; // 600ms trail lifetime
    this.trailPoints = []; // Array of {x, y, timestamp} points
    this.maxTrailPoints = 150; // Maximum points in trail
    this.isDrawing = false;
    
    // Laser element for rendering
    this.laserElement = null;
  }

  /**
   * Starts a new laser drawing session
   * @param {Object} startPoint - {x, y} world coordinates
   * @param {string} color - Laser color
   */
  startLaserDrawing(startPoint, color = '#ff0000') {
    this.isDrawing = true;
    this.trailPoints = [];
    
    // Add first point with timestamp
    this.addTrailPoint(startPoint);
    
    // Create or update laser element
    this.createLaserElement(color);
    this.startAnimation();
  }

  /**
   * Adds a point to the laser trail
   * @param {Object} newPoint - {x, y} world coordinates  
   */
  addLaserPoint(newPoint) {
    if (!this.isDrawing) return;
    
    this.addTrailPoint(newPoint);
    this.updateLaserElement();
  }

  /**
   * Adds a point to the trail with timestamp
   */
  addTrailPoint(point) {
    const now = Date.now();
    
    // Add new point with timestamp
    this.trailPoints.push({
      x: point.x,
      y: point.y,
      timestamp: now
    });
    
    // Remove points that exceed max trail length
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.shift();
    }
  }

  /**
   * Creates the laser element for rendering
   */
  createLaserElement(color) {
    this.laserElement = {
      id: 'laser_trail',
      type: 'laser-trail',
      color: color,
      strokeWidth: 1,
      trailDuration: this.trailDuration
    };

    // Add to canvas elements
    const currentElements = this.infiniteCanvas.worldElements;
    const filteredElements = currentElements.filter(el => el.id !== 'laser_trail');
    filteredElements.push(this.laserElement);
    this.infiniteCanvas.worldElements = filteredElements;
  }

  /**
   * Updates the laser element with current trail points
   */
  updateLaserElement() {
    if (!this.laserElement) return;
    
    const now = Date.now();
    
    // Filter out expired points (older than trailDuration)
    this.trailPoints = this.trailPoints.filter(point => 
      now - point.timestamp < this.trailDuration
    );
    
    // Update element with current trail points
    this.laserElement.trailPoints = [...this.trailPoints];
    this.laserElement.currentTime = now;
    
    this.infiniteCanvas.markDirty();
  }

  /**
   * Ends laser drawing session
   */
  endLaserDrawing() {
    this.isDrawing = false;
    // Trail will continue to fade naturally through animation
  }

  /**
   * Clears all laser trail
   */
  clearAllLasers() {
    this.trailPoints = [];
    this.isDrawing = false;
    
    // Remove laser element from canvas
    if (this.laserElement) {
      const currentElements = this.infiniteCanvas.worldElements;
      const filteredElements = currentElements.filter(el => el.id !== 'laser_trail');
      this.infiniteCanvas.worldElements = filteredElements;
      this.laserElement = null;
      this.infiniteCanvas.markDirty();
    }
  }

  /**
   * Start the animation loop for trail updates
   */
  startAnimation() {
    if (this.isAnimating) return; // Already running
    
    this.isAnimating = true;
    
    const animate = () => {
      if (this.laserElement) {
        this.updateLaserElement();
        
        // Continue animation if drawing or if there are still trail points
        if (this.isDrawing || this.trailPoints.length > 0) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Clean up when trail is completely gone
          this.clearAllLasers();
          this.isAnimating = false;
          this.animationFrameId = null;
        }
      } else {
        this.isAnimating = false;
        this.animationFrameId = null;
      }
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop the animation loop
   */
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.isAnimating = false;
    }
  }
}