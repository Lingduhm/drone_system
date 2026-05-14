const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const { Transform } = require('stream');

class RecordPlaybackHandler {
  constructor(ws) {
    this.ws = ws;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentFrame = 0;
    this.frameInterval = 10;
    this.frames = [];
    this.totalDuration = 0;
    this.startTime = null;
    this.lastFrameTime = null;
    this.frameTimer = null;
    this.pausedTime = 0;
    this.pauseStartTime = null;
    this.playbackState = {
      isPlaying: false,
      isPaused: false,
      currentFrame: 0,
      totalFrames: 0
    };
    this.metadata = {};
    this.frameQueue = new Map();
    this.nextFrameToProcess = 0;
  }

  async initializePlayback(projectId, fragmentId, recordName) {
    try {
      const recordPath = path.join(
        process.cwd(),
        'data/projects',
        `project-${projectId}`,
        'records',
        `fragment-${fragmentId}`,
        `${recordName}.csv`
      );

      if (!await fs.pathExists(recordPath)) {
        throw new Error('Record file not found');
      }

      // 创建文件流和readline接口
      const fileStream = fs.createReadStream(recordPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let isHeader = true;
      let isData = false;
      let dataStarted = false;
      let totalFrames = 0;
      let headerInfo = {};

      // 处理文件头部信息
      for await (const line of rl) {
        if (line.startsWith('status,completed')) {
          break;
        }

        if (line.startsWith('frameIndex,')) {
          isHeader = false;
          isData = true;
          continue;
        }

        if (isHeader && line) {
          const [key, value] = line.split(',');
          headerInfo[key] = value;
        }

        if (isData && line) {
          totalFrames++;
          if (!dataStarted) {
            dataStarted = true;
            // 发送初始化成功消息
            this.ws.send(JSON.stringify({
              type: 'PLAYBACK_INITIALIZED',
              totalFrames: 0, // 临时设置为0，稍后更新
              metadata: {
                ...headerInfo,
                fragmentId,
                duration: 0 // 临时设置为0，稍后更新
              }
            }));
          }
        }
      }

      // 关闭第一次的文件流
      fileStream.destroy();
      rl.close();

      // 更新总帧数和持续时间
      this.totalDuration = totalFrames / 100;
      this.playbackState.totalFrames = totalFrames;

      // 发送更新后的初始化信息
      this.ws.send(JSON.stringify({
        type: 'LOAD_SUCCESS',
        totalFrames: totalFrames,
        metadata: {
          ...headerInfo,
          fragmentId,
          totalFrames: totalFrames,
          duration: this.totalDuration
        }
      }));

      // 创建新的文件流用于实际播放
      this.setupFrameReader(recordPath);

    } catch (error) {
      console.error('Playback initialization failed:', error);
      this.ws.send(JSON.stringify({
        type: 'PLAYBACK_ERROR',
        message: error.message
      }));
    }
  }

  async setupFrameReader(recordPath) {
    const fileStream = fs.createReadStream(recordPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isDataSection = false;
    let frameCount = 0;

    for await (const line of rl) {
      if (line.startsWith('frameIndex,')) {
        isDataSection = true;
        continue;
      }

      if (line.startsWith('status,completed')) {
        break;
      }

      if (isDataSection && line) {
        try {
          const parts = line.split(',');
          const frameIndex = parseInt(parts[0]);
          if (isNaN(frameIndex)) continue;

          const coordinates = {
            position: [
              parseFloat(parts[1]) || 0,
              parseFloat(parts[2]) || 0,
              parseFloat(parts[3]) || 0
            ],
            markers: {
              Marker1: [
                parseFloat(parts[4]) || 0,
                parseFloat(parts[5]) || 0,
                parseFloat(parts[6]) || 0
              ],
              Marker2: [
                parseFloat(parts[7]) || 0,
                parseFloat(parts[8]) || 0,
                parseFloat(parts[9]) || 0
              ],
              Marker3: [
                parseFloat(parts[10]) || 0,
                parseFloat(parts[11]) || 0,
                parseFloat(parts[12]) || 0
              ],
              Marker4: [
                parseFloat(parts[13]) || 0,
                parseFloat(parts[14]) || 0,
                parseFloat(parts[15]) || 0
              ]
            }
          };

          // 解析矩阵数据
          const matrixStr = parts.slice(16).join(',');
          const matrix = JSON.parse(matrixStr);

          this.frameQueue.set(frameCount, {
            frameIndex,
            coordinates,
            matrix
          });

          frameCount++;
        } catch (error) {
          console.warn(`Skip invalid frame data: ${error.message}`);
          continue;
        }
      }
    }

    // 关闭流
    fileStream.destroy();
    rl.close();
  }

  // 以下方法保持不变
  startPlayback() {
    if (this.frameQueue.size === 0) return;
    
    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = process.hrtime();
    this.lastFrameTime = process.hrtime();
    this.pausedTime = 0;
    
    this.updatePlaybackState();
    this.scheduleNextFrame();
  }

  pausePlayback() {
    if (!this.isPlaying) return;

    this.isPaused = true;
    if (this.frameTimer) {
      clearTimeout(this.frameTimer);
      this.frameTimer = null;
    }

    this.pauseStartTime = process.hrtime();
    
    this.updatePlaybackState();
  }

  resumePlayback() {
    if (!this.isPlaying || !this.isPaused) return;
    
    this.isPaused = false;

    if (this.pauseStartTime) {
      const now = process.hrtime();
      const pauseDuration = (now[0] - this.pauseStartTime[0]) * 1e9 + (now[1] - this.pauseStartTime[1]);
      this.pausedTime += pauseDuration;
    }

    if (this.currentFrame < this.frameQueue.size) {
      const frame = this.frameQueue.get(this.currentFrame);
      this.ws.send(JSON.stringify({
        type: 'FRAME',
        frameIndex: frame.frameIndex,
        coordinates: frame.coordinates,
        matrix: frame.matrix
      }));
    }
    
    this.updatePlaybackState();
    setImmediate(() => this.scheduleNextFrame());
  }

  stopPlayback() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentFrame = 0;
    this.pausedTime = 0;
    this.pauseStartTime = null;
    
    if (this.frameTimer) {
      clearTimeout(this.frameTimer);
      this.frameTimer = null;
    }
    
    this.ws.send(JSON.stringify({
      type: 'FRAME',
      frameIndex: 0,
      coordinates: {
        position: [0, 0, 0],
        markers: {
          Marker1: [0, 0, 0],
          Marker2: [0, 0, 0],
          Marker3: [0, 0, 0],
          Marker4: [0, 0, 0]
        }
      },
      matrix: Array(36).fill().map(() => Array(36).fill(0))
    }));
    
    this.playbackState.currentFrame = 0;
    this.updatePlaybackState();
  }

  scheduleNextFrame() {
    if (!this.isPlaying || this.isPaused) return;

    const now = process.hrtime();
    const elapsedNanos = (now[0] - this.startTime[0]) * 1e9 + (now[1] - this.startTime[1]) - this.pausedTime;
    const elapsedMs = elapsedNanos / 1e6;
    const expectedFrame = Math.floor(elapsedMs / this.frameInterval);

    const processFrames = () => {
      while (this.currentFrame <= expectedFrame && this.currentFrame < this.frameQueue.size) {
        const frame = this.frameQueue.get(this.currentFrame);
        
        this.ws.send(JSON.stringify({
          type: 'FRAME',
          frameIndex: frame.frameIndex,
          coordinates: frame.coordinates,
          matrix: frame.matrix
        }));

        this.currentFrame++;
        this.playbackState.currentFrame = this.currentFrame;
        this.updatePlaybackState();
      }

      if (this.currentFrame >= this.frameQueue.size) {
        this.stopPlayback();
        this.ws.send(JSON.stringify({
          type: 'PLAYBACK_COMPLETED'
        }));
        return;
      }

      const frameTime = process.hrtime();
      const timeSinceLastFrame = (frameTime[0] - this.lastFrameTime[0]) * 1e9 + 
                                (frameTime[1] - this.lastFrameTime[1]);
      
      const delay = Math.max(0, Math.min(
        this.frameInterval,
        this.frameInterval - (timeSinceLastFrame / 1e6)
      ));
      
      this.lastFrameTime = frameTime;
      
      this.frameTimer = setTimeout(() => {
        setImmediate(() => this.scheduleNextFrame());
      }, delay);
    };

    processFrames();
  }

  updatePlaybackState() {
    this.ws.send(JSON.stringify({
      type: 'PLAYBACK_STATE_UPDATE',
      playbackState: {
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentFrame: this.currentFrame,
        totalFrames: this.playbackState.totalFrames
      }
    }));
  }

  handleCommand(command) {
    switch (command.type) {
      case 'INITIALIZE_PLAYBACK':
        this.initializePlayback(command.projectId, command.fragmentId, command.recordName);
        break;
      case 'START':
        this.startPlayback();
        break;
      case 'PAUSE':
        this.pausePlayback();
        break;
      case 'RESUME':
        this.resumePlayback();
        break;
      case 'STOP':
        this.stopPlayback();
        break;
    }
  }
}

module.exports = RecordPlaybackHandler;