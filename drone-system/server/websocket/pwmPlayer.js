// server/websocket/pwmPlayer.js
const path = require('path');
const fs = require('fs-extra');
const hardwareController = require('./hardwareController');

class PWMPlayer {
    constructor(wss) {
      this.wss = wss;
      this.frameInterval = 10;
      this.clients = new Map();
  
      this.wss.on('connection', (ws, request) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const clientType = url.searchParams.get('type') || 'test';
        
        console.log(`New PWM client connected, type: ${clientType}`);
        this.initializeClient(ws, clientType);
      });
    }
  
    initializeClient(ws, clientType) {
      // 创建客户端状态对象并添加仿真模式标志
      const clientState = {
        isPlaying: false,
        isPaused: false,
        currentFrame: 0,
        frameData: null,
        hasTerminal: false,
        clientType,
        simulationMode: false // 添加仿真模式标志
      };
      
      this.clients.set(ws, clientState);
  
      ws.on('message', async (message) => {
        try {
          const command = JSON.parse(message.toString());
          await this.handleCommand(ws, command);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });
  
      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });
    }

    async handleCommand(ws, command) {
        const state = this.clients.get(ws);
        if (!state) return;

        switch (command.type) {
            case 'LOAD_FILE':
                await this.loadFile(ws, command.filename);
                break;
            case 'START':
                await this.startPlayback(ws, command.startFrame || 0);
                break;
            case 'PAUSE':
                this.pausePlayback(ws);
                break;
            case 'RESUME':
                await this.resumePlayback(ws);
                break;
            case 'STOP':
                this.stopPlayback(ws);
                break;
            case 'SEEK':
                await this.seekTo(ws, command.frame, command.pause);
                break;
            case 'SET_TERMINAL':
                state.hasTerminal = command.isOpen;
                break;
            case 'SET_RUN_MODE':
                // 修改仿真模式设置
                state.simulationMode = command.mode === 'real';
                hardwareController.setSimulationMode(state.simulationMode, state.clientType);
                break;
        }
    }

    async loadFile(ws, filename) {
        const state = this.clients.get(ws);
        if (!state) return;
    
        try {
          // 根据客户端类型选择不同的文件路径
          const basePath = state.clientType === 'fragment' 
            ? 'data/csv_files/fragment'
            : 'data/csv_files/test';
          
          const filePath = path.join(process.cwd(), basePath, filename);
          console.log('Loading file from:', filePath);
    
          const data = await fs.readJson(filePath);
          state.frameData = data;
          state.currentFrame = 0;
          
          ws.send(JSON.stringify({
            type: 'LOAD_SUCCESS',
            totalFrames: Object.keys(data).length
          }));
        } catch (error) {
          console.error('Error loading file:', error);
          ws.send(JSON.stringify({
            type: 'LOAD_ERROR',
            message: error.message
          }));
        }
      }

      async startPlayback(ws, startFrame = 0) {
        const state = this.clients.get(ws);
        if (!state || !state.frameData) return;
    
        state.isPlaying = true;
        state.isPaused = false;
        
        // 设置开始帧
        state.currentFrame = startFrame;
        
        // 从指定帧开始计时
        state.startTime = process.hrtime.bigint();
        // 调整开始时间，考虑已经过去的帧数
        const adjustment = BigInt(startFrame * this.frameInterval * 1000000);
        state.startTime -= adjustment;
        
        await this.scheduleNextFrame(ws);
    }

    async scheduleNextFrame(ws) {
      const state = this.clients.get(ws);
      if (!state || !state.isPlaying || state.isPaused) {
          if (state) {
              state.isPlaying = false;
              state.isPaused = true;
              ws.send(JSON.stringify({
                  type: 'PLAYBACK_STATE_UPDATE',
                  playbackState: {
                      isPlaying: false,
                      isPaused: true
                  }
              }));
          }
          return;
      }
  
      const frameKey = `frame${state.currentFrame + 1}`;
      const frame = state.frameData[frameKey];
  
      if (!frame) {
          this.stopPlayback(ws);
          return;
      }
  
      try {
          // 处理并发送当前帧
          const processedMatrix = this.processFrameMatrix(frame);
          
          // 发送帧数据
          ws.send(JSON.stringify({
              type: 'FRAME',
              frameIndex: state.currentFrame + 1,
              matrix: processedMatrix
          }));
  
          // 发送终端数据
          if (state.hasTerminal) {
              ws.send(JSON.stringify({
                  type: 'MATRIX_UPDATE',
                  frameIndex: state.currentFrame + 1,
                  matrix: JSON.stringify(processedMatrix)
              }));
          }
  
          // 仿真模式时发送到硬件控制器
          if (state.simulationMode) {
            await hardwareController.sendToHardware(processedMatrix, state.clientType);
        }
          
          // 计算下一帧的时间
          const idealTime = Number(process.hrtime.bigint() - state.startTime) / 1e6;
          const targetTime = (state.currentFrame + 1) * this.frameInterval;
          const delay = Math.max(0, targetTime - idealTime);
  
          state.currentFrame++;
  
          if (delay < 1) {
              setImmediate(() => this.scheduleNextFrame(ws));
          } else {
              setTimeout(() => this.scheduleNextFrame(ws), delay);
          }
  
      } catch (error) {
          console.error('Frame processing error:', error);
          this.stopPlayback(ws);
      }
  }

processFrameMatrix(frame) {
  const fullMatrix = new Array(36);
  const backgroundPWM = frame.backgroundPWM;
  
  // 单次分配所有行
  for (let i = 0; i < 36; i++) {
      fullMatrix[i] = new Array(36).fill(backgroundPWM);
  }

  const { matrix, windMatrixWidth, windMatrixHeight } = frame;
  const [centerX, centerY] = frame.center === "xy" ? [18, 18] : frame.center;

  const startX = Math.max(0, Math.min(36 - windMatrixWidth, Math.floor(centerX - windMatrixWidth / 2)));
  const startY = Math.max(0, Math.min(36 - windMatrixHeight, Math.floor(centerY - windMatrixHeight / 2)));

  // 批量复制行数据
  for (let y = 0; y < windMatrixHeight; y++) {
      const fullY = startY + y;
      if (fullY >= 0 && fullY < 36) {
          const matrixRow = matrix[y];
          const fullMatrixRow = fullMatrix[fullY];
          const copyStart = Math.max(0, startX);
          const copyEnd = Math.min(36, startX + windMatrixWidth);
          for (let x = 0; x < windMatrixWidth; x++) {
              const fullX = startX + x;
              if (fullX >= copyStart && fullX < copyEnd) {
                  fullMatrixRow[fullX] = matrixRow[x];
              }
          }
      }
  }

  return fullMatrix;
}

    pausePlayback(ws) {
        const state = this.clients.get(ws);
        if (!state) return;

        state.isPaused = true;
    }

    async resumePlayback(ws) {
      const state = this.clients.get(ws);
      if (!state) return;

      state.isPaused = false;
      state.startTime = process.hrtime.bigint(); // 恢复时重置开始时间
      await this.scheduleNextFrame(ws);
  }

    stopPlayback(ws) {
        const state = this.clients.get(ws);
        if (!state) return;

        state.isPlaying = false;
        state.isPaused = false;
        state.currentFrame = 0;
    }

    async seekTo(ws, frameNumber, shouldPause = true) {
      const state = this.clients.get(ws);
      if (!state || !state.frameData) return;
  
      // 强制暂停所有播放活动
      state.isPlaying = false;
      state.isPaused = true;
      
      // 清除任何可能的定时器
      if (state.playbackTimeout) {
          clearTimeout(state.playbackTimeout);
          state.playbackTimeout = null;
      }
  
      const frameKey = `frame${frameNumber}`;
      const frame = state.frameData[frameKey];
      
      if (frame) {
          const processedMatrix = this.processFrameMatrix(frame);
          await ws.send(JSON.stringify({
              type: 'FRAME',
              frameIndex: frameNumber,
              matrix: processedMatrix,
              playbackState: {
                  isPlaying: false,
                  isPaused: true
              }
          }));
      }
  
      state.currentFrame = frameNumber - 1;
  }
  
    // 在类的末尾添加清理方法
    cleanup() {
      hardwareController.cleanup();
    }
}

module.exports = PWMPlayer;