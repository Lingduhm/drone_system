// src/services/motionCaptureService.js
class MotionCaptureService {
  constructor() {
    this.subscribers = new Set();
    this.isStreaming = false;
    this.ws = null;
    this.frameInterval = 10; // 10ms
    this.startTime = null;
    this.lastFrameTime = null;
    this.frameCount = 0;
    this.accumulatedTime = 0;
    this.currentFrame = 0;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`ws://${window.location.hostname}:8765`);
    
    this.ws.onmessage = (event) => {
      if (!this.isStreaming) return;
      
      try {
        const frame = JSON.parse(event.data);
        this.processFrame(frame);
      } catch (error) {
        console.error('Error parsing motion data:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.isStreaming = false;
      this.startTime = null;
      this.lastFrameTime = null;
      this.frameCount = 0;
      this.accumulatedTime = 0;
    };

    return new Promise((resolve) => {
      this.ws.onopen = () => {
        console.log('Connected to motion capture simulator');
        resolve();
      };
    });
  }

  processFrame(frame) {
    const currentTime = performance.now();
    
    if (!this.lastFrameTime) {
        this.lastFrameTime = currentTime;
        this.startTime = currentTime;
        this.accumulatedTime = 0;
        return;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.accumulatedTime += deltaTime;

    // 处理所有累积的帧
    while (this.accumulatedTime >= this.frameInterval) {
        const elapsedTime = currentTime - this.startTime;
        const frameNumber = Math.floor(elapsedTime / this.frameInterval);
        
        const frameData = {
            ...frame,
            timestamp: currentTime,
            elapsedTime: frameNumber * this.frameInterval,
            frameNumber: frameNumber
        };

        this.subscribers.forEach(callback => callback(frameData));
        this.accumulatedTime -= this.frameInterval;
    }
}

  async startStream() {
    if (this.isStreaming) return;
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    this.currentFrame = 0;  // 重置帧计数
    this.ws.send(JSON.stringify({ 
      type: 'START',
      frame: this.currentFrame 
    }));
    
    this.isStreaming = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    this.accumulatedTime = 0;
  }

  pauseStream() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PAUSE' }));
    }
    this.isStreaming = false;
  }

  resumeStream(startFrame) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.currentFrame = startFrame;
      this.ws.send(JSON.stringify({ 
        type: 'RESUME',
        frame: startFrame 
      }));
      this.isStreaming = true;
      this.lastFrameTime = Date.now();
    }
  }

  stopStream() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'STOP' }));
    }
    
    this.isStreaming = false;
    this.startTime = null;
    this.lastFrameTime = null;
    this.frameCount = 0;
    this.accumulatedTime = 0;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

export default new MotionCaptureService();