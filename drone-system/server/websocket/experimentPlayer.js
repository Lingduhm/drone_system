const fs = require('fs-extra');
const path = require('path');
const WebSocket = require('ws');
const RecordPlaybackHandler = require('./recordPlaybackHandler');
const hardwareController = require('./hardwareController'); // 添加在文件顶部

class ExperimentPlayer {
  constructor(wss) {
    this.wss = wss;
    this.frameInterval = 10;
    this.clients = new Map();
    this.mocapClients = new Map();
    this.recordsPath = path.join(process.cwd(), 'data', 'projects');
    this.frameBuffer = new Map();  // 用于存储每个客户端的帧缓冲区
    this.connectToMocapSimulator();
    this.frameCoordinates = new Map();  // Key: frameIndex, Value: coordinates
    this.lastProcessTime = new Map();   // 用于追踪每个客户端的帧处理时间
    this.mocapTestClients = new Map(); // 新增：专门存储测试客户端
    hardwareController.setSimulationMode(true, 'experiment');
    this.connectToMocapSimulator();  // 确保连接到模拟器
  }

  convertMocapFormat(mocapData) {
    // 检查数据有效性
    if (!mocapData || !mocapData.MarkerSets || mocapData.MarkerSets.length === 0) {
      return null;
    }
  
    // 只提取第一个 MarkerSet
    const firstMarkerSet = mocapData.MarkerSets[0];
    
    if (!firstMarkerSet.Markers || firstMarkerSet.Markers.length === 0) {
      return null;
    }
  
    // 计算所有 marker 点的平均位置作为中心点
    const sumPos = [0, 0, 0];
    firstMarkerSet.Markers.forEach(marker => {
      sumPos[0] += marker.Position[0];
      sumPos[1] += marker.Position[1];
      sumPos[2] += marker.Position[2];
    });
  
    const markerCount = firstMarkerSet.Markers.length;
    const position = [
      Math.round(sumPos[0] / markerCount * 100) / 100, // 保留2位小数
      Math.round(sumPos[1] / markerCount * 100) / 100,
      Math.round(sumPos[2] / markerCount * 100) / 100
    ];
  
    // 创建转换后的对象
    const convertedData = {
      position: position
    };
  
    // 添加每个 marker 点
    firstMarkerSet.Markers.forEach((marker, index) => {
      const markerKey = `Marker${index + 1}`;
      convertedData[markerKey] = [
        Math.round(marker.Position[0] * 100) / 100,
        Math.round(marker.Position[1] * 100) / 100,
        Math.round(marker.Position[2] * 100) / 100
      ];
    });
  
    return convertedData;
  }

  async initializeExperimentClient(ws, request) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const projectId = url.searchParams.get('projectId');
    const fragmentId = url.searchParams.get('fragmentId');
    const isPlayback = url.searchParams.get('mode') === 'playback';
  
    console.log('Initializing client:', { projectId, fragmentId, isPlayback }); // 添加日志
  
    const clientState = {
      isPlaying: false,
      isPaused: false,
      currentFrame: 0,
      frameData: null,
      hasTerminal: false,
      projectId,
      fragmentId,
      recordStartTime: null,
      mocapData: null,
      pendingFrames: [],
      isRecordingInitialized: false,
      isPlaybackMode: isPlayback,
      playbackHandler: isPlayback ? new RecordPlaybackHandler(ws) : null,
      reconnectAttempts: 0
    };
    
    this.clients.set(ws, clientState);
  
    const setupWebSocket = () => {
      ws.on('message', async (message) => {
        try {
          const command = JSON.parse(message.toString());
          console.log('Received command:', command.type); // 添加日志
          if (clientState.isPlaybackMode) {
            clientState.playbackHandler.handleCommand(command);
          } else {
            await this.handleCommand(ws, command);
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });
  
      ws.on('close', () => {
        console.log('Client disconnected');
        // 在播放状态下尝试重连
        if (clientState.isPlaying && clientState.reconnectAttempts < 3) {
          console.log('Attempting to reconnect...');
          setTimeout(() => {
            clientState.reconnectAttempts++;
            setupWebSocket();
          }, 1000);
        } else {
          if (clientState.isPlaying) {
            if (clientState.isPlaybackMode) {
              clientState.playbackHandler.stopPlayback();
            } else {
              this.stopPlayback(ws);
            }
          }
          // 清理客户端
          this.clients.delete(ws);
          // 关闭硬件控制器
          hardwareController.setSimulationMode(false, 'experiment');
        }
      });
  
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    };
  
    setupWebSocket();
  }

  initializeMocapTestClient(ws) {
    console.log('Mocap test client connected');
    const clientState = {
      isPlaying: false,
      isPaused: false
    };
    
    this.mocapTestClients.set(ws, clientState);
  
    ws.on('message', async (message) => {
      try {
        const command = JSON.parse(message.toString());
        console.log('Received test command:', command);
        
        switch(command.type) {
          case 'START':
            clientState.isPlaying = true;
            clientState.isPaused = false;
            // 不再向摄像头发送命令
            break;
            
          case 'PAUSE':
            clientState.isPaused = true;
            // 不再向摄像头发送命令
            break;
            
          case 'RESUME':
            clientState.isPaused = false;
            // 不再向摄像头发送命令
            break;
            
          case 'STOP':
            clientState.isPlaying = false;
            clientState.isPaused = false;
            // 不再向摄像头发送命令
            break;
        }
      } catch (error) {
        console.error('Error handling mocap test command:', error);
      }
    });
  
    ws.on('close', () => {
      console.log('Mocap test client disconnected');
      this.mocapTestClients.delete(ws);
    });
  }

  // 初始化动捕客户端
 // 修改 initializeMocapClient 方法
initializeMocapClient(ws) {
  console.log('Mocap client connected');
  
  const state = {
    isPlaying: false,
    isPaused: false
  };
  
  this.mocapClients.set(ws, state);

  ws.on('message', async (message) => {
    try {
      const command = JSON.parse(message.toString());
      
      switch(command.type) {
        case 'START':
          state.isPlaying = true;
          state.isPaused = false;
          // 不再向摄像头发送命令
          break;
          
        case 'PAUSE':
          state.isPaused = true;
          // 不再向摄像头发送命令
          break;
          
        case 'RESUME':
          if(state.isPlaying) {
            state.isPaused = false;
            // 不再向摄像头发送命令
          }
          break;
          
        case 'STOP':
          state.isPlaying = false;
          state.isPaused = false;
          // 不再向摄像头发送命令
          break;
      }
    } catch (error) {
      console.error('Error handling mocap command:', error);
    }
  });

  ws.on('close', () => {
    console.log('Mocap client disconnected');
    this.mocapClients.delete(ws);
  });
}

  // 广播动捕数据给所有播放中的客户端
 async broadcastMocapData(mocapData) {
    // 广播到实验客户端
    for (const [ws, state] of this.clients.entries()) {
      if (state.isPlaying && !state.isPaused) {
        await this.processDynamicFrame(ws, state, mocapData);
      }
    }

    // 广播到测试客户端
    for (const [ws, state] of this.mocapTestClients.entries()) {
      if (state.isPlaying && !state.isPaused) {
        try {
          ws.send(JSON.stringify({
            type: 'MOCAP_DATA',
            data: {
              position: mocapData.position,
              markers: mocapData.markers || {
                Marker1: mocapData.Marker1,
                Marker2: mocapData.Marker2,
                Marker3: mocapData.Marker3,
                Marker4: mocapData.Marker4
              }
            }
          }));
        } catch (error) {
          console.error('Error broadcasting to test client:', error);
        }
      }
    }
  }

  async initializeRecordPlayback(ws, state, recordName) {
    try {
      const recordPath = path.join(
        this.recordsPath,
        `project-${state.projectId}`,
        'records',
        `fragment-${state.fragmentId}`,
        `${recordName}.csv`
      );
  
      if (!await fs.pathExists(recordPath)) {
        throw new Error('Record file not found');
      }
  
      // 读取CSV文件内容
      const content = await fs.readFile(recordPath, 'utf8');
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
      // 解析记录数据
      const frameData = [];
      const dataStartIndex = lines.findIndex(line => line.startsWith('frameIndex,')) + 1;
      
      for (let i = dataStartIndex; i < lines.length; i++) {
        if (lines[i].startsWith('status,')) break;
        
        const [frameIndex, x, y, z, matrix] = lines[i].split(',');
        frameData.push({
          frameIndex: parseInt(frameIndex),
          coordinates: {
            position: [parseFloat(x), parseFloat(y), parseFloat(z)]
          },
          matrix: JSON.parse(matrix)
        });
      }
  
      // 发送初始化成功消息
      ws.send(JSON.stringify({
        type: 'LOAD_SUCCESS',
        totalFrames: frameData.length,
        metadata: {
          duration: frameData.length / 100 // 100fps = 10ms per frame
        }
      }));
  
      state.frameData = frameData;
      state.currentFrame = 0;
  
    } catch (error) {
      console.error('Failed to initialize record playback:', error);
      ws.send(JSON.stringify({
        type: 'LOAD_ERROR',
        message: error.message
      }));
    }
  }

  // 处理命令
  async handleCommand(ws, command) {
    const state = this.clients.get(ws);
    if (!state) return;
  
    switch (command.type) {
      case 'INITIALIZE_PLAYBACK':
        await this.initializeRecordPlayback(ws, state, command.recordName);
        break;
      case 'INITIALIZE':
        // 保持初始化逻辑不变
        state.projectId = command.projectId;
        state.fragmentId = command.fragmentId;
        if (!command.filename) {
          console.error('Missing filename in INITIALIZE command');
          return;
        }
        await this.loadExperimentFile(ws, command.filename);
        break;
  
      case 'START':
        // 修改开始命令，不再向摄像头发送信号
        await this.startPlayback(ws);
        break;
  
      case 'PAUSE':
        // 修改暂停命令，不再向摄像头发送信号
        await this.pausePlayback(ws);
        break;
  
      case 'RESUME':
        // 修改恢复命令，不再向摄像头发送信号
        await this.resumePlayback(ws);
        break;
  
      case 'STOP':
        // 修改停止命令，不再向摄像头发送信号
        await this.stopPlayback(ws);
        break;
  
      case 'SET_TERMINAL':
        state.hasTerminal = command.isOpen;
        break;
    }
  }
  
    // 加载实验文件
    async loadExperimentFile(ws, filename) {
      const state = this.clients.get(ws);
      if (!state) return;
  
          // 先清理之前的数据
      if (state.frameData) {
        state.frameData = null;
      }
      
      try {
          const filePath = path.join(
              process.cwd(),
              'data/csv_files/fragment',
              filename
          );
  
          if (!await fs.pathExists(filePath)) {
              throw new Error('文件不存在');
          }
  
          // 创建文件流
          const fileStream = fs.createReadStream(filePath, {
              encoding: 'utf8',
              highWaterMark: 1024 * 1024 // 1MB chunks
          });
  
          let buffer = '';
          let firstChunk = true;
          let frameCount = 0;
          state.frameData = {};
  
          fileStream.on('data', chunk => {
              // 第一个chunk时处理开头的 {
              if (firstChunk) {
                  chunk = chunk.slice(1);
                  firstChunk = false;
              }
  
              buffer += chunk;
  
              // 处理完整的帧
              while (true) {
                  const frameMatch = buffer.match(/"frame\d+":\s*({[^}]+})/);
                  if (!frameMatch) break;
  
                  try {
                      // 提取帧号和帧数据
                      const frameData = frameMatch[0];
                      const frameNumberMatch = frameData.match(/frame(\d+)/);
                      if (frameNumberMatch) {
                          const frameNumber = frameNumberMatch[1];
                          const frameContent = `{${frameData}}`;
                          const parsedFrame = JSON.parse(frameContent);
                          state.frameData[`frame${frameNumber}`] = parsedFrame[`frame${frameNumber}`];
                          frameCount++;
                      }
  
                      // 移除已处理的帧数据
                      buffer = buffer.slice(frameMatch.index + frameMatch[0].length);
  
                      // 移除下一个帧之前的逗号
                      const commaIndex = buffer.indexOf(',');
                      if (commaIndex === 0) {
                          buffer = buffer.slice(1);
                      }
  
                  } catch (error) {
                      // 如果解析失败,移动到下一个 frame 标记
                      const nextFrame = buffer.indexOf('"frame', 1);
                      if (nextFrame > 0) {
                          buffer = buffer.slice(nextFrame);
                      } else {
                          break;
                      }
                  }
              }
          });
  
          fileStream.on('end', () => {
              // 如果还有剩余数据,尝试解析最后一帧
              if (buffer.length > 0) {
                  const lastFrameMatch = buffer.match(/"frame\d+":\s*({[^}]+})/);
                  if (lastFrameMatch) {
                      try {
                          const frameData = lastFrameMatch[0];
                          const frameNumberMatch = frameData.match(/frame(\d+)/);
                          if (frameNumberMatch) {
                              const frameNumber = frameNumberMatch[1];
                              const frameContent = `{${frameData}}`;
                              const parsedFrame = JSON.parse(frameContent);
                              state.frameData[`frame${frameNumber}`] = parsedFrame[`frame${frameNumber}`];
                              frameCount++;
                          }
                      } catch (error) {
                          console.error('解析最后帧数据失败:', error);
                      }
                  }
              }
  
              // 发送加载完成消息
              ws.send(JSON.stringify({
                  type: 'LOAD_SUCCESS',
                  totalFrames: frameCount
              }));
          });
  
          fileStream.on('error', error => {
              console.error('读取文件失败:', error);
              ws.send(JSON.stringify({
                  type: 'LOAD_ERROR',
                  message: error.message
              }));
          });
  
      } catch (error) {
          console.error('加载实验文件失败:', error);
          ws.send(JSON.stringify({
              type: 'LOAD_ERROR',
              message: error.message
          }));
      }
  }

  // 初始化实验记录
  async initializeExperimentRecord(state) {
    if (!state.projectId || !state.fragmentId || !state.frameData) {
        console.error('Missing required data for record initialization');
        return;
    }

    // 检查是否有有效的帧数据
    const firstFrame = state.frameData.frame1;
    if (!firstFrame) {
        console.error('No valid frame data for recording');
        return;
    }

    const recordDir = path.join(
        this.recordsPath,
        `project-${state.projectId}`,
        'records',
        `fragment-${state.fragmentId}`
    );

    await fs.ensureDir(recordDir);

    // 获取现有记录数并生成新记录名
    const files = await fs.readdir(recordDir);
    const trackNum = Math.max(
        0,
        ...files
            .filter(f => f.startsWith('track-'))
            .map(f => parseInt(f.match(/track-(\d+)\.csv/)?.[1] || '0'))
    ) + 1;

    state.recordPath = path.join(recordDir, `track-${trackNum}.csv`);
    state.recordStartTime = new Date().toISOString();
    state.frameSet = new Set();

    // 写入记录头部
    const header = [
      `experimentId,track-${trackNum}`,
      `startTime,${state.recordStartTime}`,
      `fragmentId,${state.fragmentId}`,
      `projectId,${state.projectId}`,
      'status,started',
      'frameIndex,centerX,centerY,centerZ,marker1X,marker1Y,marker1Z,marker2X,marker2Y,marker2Z,marker3X,marker3Y,marker3Z,marker4X,marker4Y,marker4Z,matrix'
    ].join('\n');

    await fs.writeFile(state.recordPath, header + '\n', 'utf8');
}

 // 新增: 连接到摄像头模拟器
// experimentPlayer.js 中修改 connectToMocapSimulator 方法
async connectToMocapSimulator() {
  try {
    const MOCAP_SERVER = process.env.MOCAP_SERVER_HOST || '0.0.0.0';
    const MOCAP_PORT = process.env.MOCAP_PORT || 8765;
    const mocapWs = new WebSocket(`ws://${MOCAP_SERVER}:${MOCAP_PORT}`);
    
    mocapWs.on('open', () => {
      console.log('Connected to motion capture simulator');
      this.mocapClient = mocapWs;
    });

    mocapWs.on('message', async (message) => {
      try {
        const mocapData = JSON.parse(message.toString());
        
        // 转换数据格式
        const convertedData = this.convertMocapFormat(mocapData);
        if (!convertedData) {
          console.warn("Failed to convert mocap data", mocapData);
          return;
        }
    
        // 发送数据到测试客户端
        for (const [ws, state] of this.mocapTestClients.entries()) {
          if (state.isPlaying && !state.isPaused) {
            try {
              // 发送转换后的数据
              ws.send(JSON.stringify({
                type: 'MOCAP_DATA',
                data: convertedData
              }));
            } catch (error) {
              console.error('Error broadcasting to test client:', error);
            }
          }
        }
    
        // 只有在播放且未暂停状态的客户端才会接收和处理动捕数据
        for (const [clientWs, state] of this.clients.entries()) {
          if (state.isPlaying && !state.isPaused) {
            state.mocapData = convertedData;
            const frameKey = `frame${state.currentFrame + 1}`;
            const frame = state.frameData?.[frameKey];
            if (frame?.isDynamic) {
              await this.processDynamicFrame(clientWs, state, convertedData);
            }
          }
        }
      } catch (error) {
        console.error('Error handling mocap data:', error);
      }
    });

    mocapWs.on('close', () => {
      console.log('Motion capture simulator disconnected');
      this.mocapClient = null;
      // 尝试重新连接
      setTimeout(() => this.connectToMocapSimulator(), 5000);
    });

    mocapWs.on('error', (error) => {
      console.error('Mocap connection error:', error);
      this.mocapClient = null;
    });

  } catch (error) {
    console.error('Failed to connect to mocap simulator:', error);
    // 尝试重新连接
    setTimeout(() => this.connectToMocapSimulator(), 5000);
  }
}

// 修改播放控制相关方法
async startPlayback(ws) {
  const state = this.clients.get(ws);
  if (!state || !state.frameData) return;

  // 确保在开始播放前初始化记录，并检查是否有有效数据
  if (!state.isRecordingInitialized) {
      const firstFrame = state.frameData.frame1;
      if (!firstFrame) {
          console.error('No valid frame data available');
          return;
      }

      // 在实际有帧数据的情况下才初始化记录
      await this.initializeExperimentRecord(state);
      state.isRecordingInitialized = true;
  }

  state.isPlaying = true;
  state.isPaused = false;
  state.startTime = process.hrtime.bigint();
  state.currentFrame = 0;
  state.lastProcessedFrame = 0;

  // 初始化帧缓冲结构
  let clientBuffer = this.frameBuffer.get(state.recordPath);
  if (!clientBuffer) {
      clientBuffer = {
          processed: new Set(),
          recorded: new Set(),
          bufferedFrames: new Map(),
          lastRecordedFrame: 0
      };
      this.frameBuffer.set(state.recordPath, clientBuffer);
  }

  // 不再向摄像头发送命令
  // if (this.mocapClient && this.mocapClient.readyState === WebSocket.OPEN) {
  //   this.mocapClient.send(JSON.stringify({ type: 'START' }));
  // }

  // 确保第一帧存在并且有效
  const firstFrame = state.frameData.frame1;
  if (firstFrame && !clientBuffer.processed.has(1)) {
      await this.processAndBufferFrame(state, {
          frameIndex: 1,
          mocapData: state.mocapData || { position: [0, 0, 0] },
          matrix: this.generateFullMatrix(firstFrame)
      });
  }

  await this.scheduleNextFrame(ws);
}

// 类似地修改其他播放控制方法...
async pausePlayback(ws) {
  const state = this.clients.get(ws);
  if (!state) return;

  state.isPaused = true;

  // 不再向摄像头发送命令
  // if (this.mocapClient && this.mocapClient.readyState === WebSocket.OPEN) {
  //   console.log('Sending PAUSE command to mocap simulator');
  //   this.mocapClient.send(JSON.stringify({ type: 'PAUSE' }));
  // }

  this.updatePlaybackState(ws, state);
}

async resumePlayback(ws) {
  const state = this.clients.get(ws);
  if (!state) return;

  state.isPaused = false;
  state.startTime = process.hrtime.bigint() - 
      BigInt(state.currentFrame * this.frameInterval * 1000000);

  // 不再向摄像头发送命令
  // if (this.mocapClient && this.mocapClient.readyState === WebSocket.OPEN) {
  //   console.log('Sending RESUME command to mocap simulator');
  //   this.mocapClient.send(JSON.stringify({ type: 'RESUME' }));
  // }

  await this.scheduleNextFrame(ws);
}

async stopPlayback(ws) {
  const state = this.clients.get(ws);
  if (!state) return;

      // 清理坐标缓存和时间记录
      this.frameCoordinates.clear();
      this.lastProcessTime.delete(ws);
      
  // 关闭硬件控制器的实验模式
  hardwareController.setSimulationMode(false, 'experiment');

  // 只有在实际完成播放或手动停止且记录已初始化时才完成记录
  if (state.isRecordingInitialized && state.currentFrame > 0 && state.recordPath) {
    const endTime = new Date().toISOString();
    
    await fs.appendFile(state.recordPath, [
      'status,completed',
      `endTime,${endTime}`,
      `totalFrames,${state.currentFrame}`,
      `duration,${(state.currentFrame * this.frameInterval) / 1000}s`
    ].join('\n'), 'utf8');

    // 清理该客户端的帧缓冲
    this.frameBuffer.delete(state.recordPath);

    // 发送记录完成通知
    ws.send(JSON.stringify({
      type: 'RECORD_COMPLETED',
      fragmentId: state.fragmentId,
      projectId: state.projectId
    }));
  }

  // 重置状态
  state.isPlaying = false;
  state.isPaused = false;
  state.currentFrame = 0;
  state.mocapData = null;
  state.isRecordingInitialized = false;

  // 不再向摄像头发送命令
  // if (this.mocapClient && this.mocapClient.readyState === WebSocket.OPEN) {
  //   this.mocapClient.send(JSON.stringify({ type: 'STOP' }));
  // }


  this.updatePlaybackState(ws, state);
}


  // 处理下一帧
  async scheduleNextFrame(ws) {
    const state = this.clients.get(ws);
    if (!state || !state.isPlaying || state.isPaused) {
      if (state) {
        this.updatePlaybackState(ws, state);
      }
      return;
    }
  
    const nextFrameIndex = state.currentFrame + 1;
    const frameKey = `frame${nextFrameIndex}`;
    const frame = state.frameData[frameKey];
  
    if (!frame) {
      await this.stopPlayback(ws);
      return;
    }
  
    try {
      const currentTime = Date.now();
      const lastTime = this.lastProcessTime.get(ws) || 0;
      
      // 确保按照固定时间间隔处理帧
      if (currentTime - lastTime >= this.frameInterval) {
        let processedMatrix;
  
        if (frame.isDynamic && state.mocapData) {
          // 处理动态帧
          let frameCoords = this.frameCoordinates.get(nextFrameIndex);
          if (!frameCoords) {
            frameCoords = this.calculateMatrixCenter(state.mocapData);
            this.frameCoordinates.set(nextFrameIndex, frameCoords);
          }
  
          processedMatrix = this.generateFullMatrix({
            ...frame,
            center: frameCoords
          });
  
          await this.processAndSendFrame(ws, state, {
            frameIndex: nextFrameIndex,
            mocapData: state.mocapData,
            matrix: processedMatrix
          });
        } else {
          // 处理静态帧
          processedMatrix = this.generateFullMatrix(frame);
          await this.processAndSendFrame(ws, state, {
            frameIndex: nextFrameIndex,
            mocapData: state.mocapData || { position: [0, 0, 0] },
            matrix: processedMatrix
          });
        }
  
        // 无论是静态还是动态帧，都发送到硬件
        await hardwareController.sendToHardware(processedMatrix, 'experiment');
  
        this.lastProcessTime.set(ws, currentTime);
        state.currentFrame = nextFrameIndex;
      }
  
      // 计算下一帧的延迟时间
      const idealTime = nextFrameIndex * this.frameInterval;
      const actualTime = currentTime - (state.startTime 
        ? Number(state.startTime) / 1e6 
        : currentTime);
      const delay = Math.max(0, idealTime - actualTime);
  
      if (delay < 1) {
        setImmediate(() => this.scheduleNextFrame(ws));
      } else {
        setTimeout(() => this.scheduleNextFrame(ws), delay);
      }
  
    } catch (error) {
      console.error('帧处理错误:', error);
      await this.stopPlayback(ws);
    }
  }

   // 新增：统一处理和发送帧的方法
   async processAndSendFrame(ws, state, frameData) {
    // 发送帧数据到客户端
    await this.sendFrameData(ws, state, {
      frameIndex: frameData.frameIndex,
      matrix: frameData.matrix,
      coordinates: frameData.mocapData
    });

    // 使用缓冲处理来保存记录
    await this.processAndBufferFrame(state, frameData);
  }

     // 添加帧处理缓冲方法
     async processAndBufferFrame(state, frameData) {
      const { frameIndex, mocapData, matrix } = frameData;
      
      // 获取该客户端的缓冲区
      let clientBuffer = this.frameBuffer.get(state.recordPath);
      if (!clientBuffer) {
        clientBuffer = {
          processed: new Set(),
          recorded: new Set(),
          bufferedFrames: new Map(),
          lastRecordedFrame: 0
        };
        this.frameBuffer.set(state.recordPath, clientBuffer);
      }
    
      // 如果已经处理过这一帧，直接返回
      if (clientBuffer.processed.has(frameIndex)) {
        return;
      }
    
      // 标记帧已处理
      clientBuffer.processed.add(frameIndex);
    
      // 如果这一帧已经记录过，不再重复记录
      if (clientBuffer.recorded.has(frameIndex)) {
        return;
      }
    
      // 从 mocapData 中提取所有坐标点数据
      const centerPoint = mocapData.position || [0, 0, 0];
      const markers = {
        Marker1: mocapData.markers?.Marker1 || mocapData.Marker1 || [0, 0, 0],
        Marker2: mocapData.markers?.Marker2 || mocapData.Marker2 || [0, 0, 0],
        Marker3: mocapData.markers?.Marker3 || mocapData.Marker3 || [0, 0, 0],
        Marker4: mocapData.markers?.Marker4 || mocapData.Marker4 || [0, 0, 0]
      };
    
      // 将所有坐标放入一行
      const coordinates = [
        ...centerPoint, // 中心点 x,y,z
        ...markers.Marker1, // Marker1 x,y,z
        ...markers.Marker2, // Marker2 x,y,z
        ...markers.Marker3, // Marker3 x,y,z
        ...markers.Marker4  // Marker4 x,y,z
      ].map(coord => coord.toFixed(2)); // 保留两位小数
    
      // 构建CSV行，保持格式统一
      const csvLine = `${frameIndex},${coordinates.join(',')},${JSON.stringify(matrix)}\n`;
    
      try {
        // 只有当前面的帧都已记录时才记录这一帧
        if (frameIndex === clientBuffer.lastRecordedFrame + 1) {
          await fs.appendFile(state.recordPath, csvLine, 'utf8');
          clientBuffer.recorded.add(frameIndex);
          clientBuffer.lastRecordedFrame = frameIndex;
    
          // 检查缓存中是否有后续帧可以写入
          let nextFrameIndex = frameIndex + 1;
          while (clientBuffer.bufferedFrames.has(nextFrameIndex)) {
            const nextFrameData = clientBuffer.bufferedFrames.get(nextFrameIndex);
            await fs.appendFile(state.recordPath, nextFrameData, 'utf8');
            clientBuffer.recorded.add(nextFrameIndex);
            clientBuffer.bufferedFrames.delete(nextFrameIndex);
            clientBuffer.lastRecordedFrame = nextFrameIndex;
            nextFrameIndex++;
          }
        } else {
          // 如果当前帧不是下一个要记录的帧，先放入缓存
          clientBuffer.bufferedFrames.set(frameIndex, csvLine);
        }
      } catch (error) {
        console.error('Error saving record:', error);
      }
    }

  // 处理动态中心点帧
 async processDynamicFrame(ws, state, mocapData) {
  if (!state.isRecordingInitialized) return;

  const frameKey = `frame${state.currentFrame + 1}`;
  const frame = state.frameData[frameKey];
  
  if (!frame || !mocapData || !frame.isDynamic) {
    return;
  }

  // 添加这一行来获取当前时间
  const currentTime = Date.now();
  const lastTime = this.lastProcessTime.get(ws) || 0;
  
  // 确保按照固定时间间隔处理帧
  if (currentTime - lastTime < this.frameInterval) {
    return;
  }

  try {
    let frameCoords = this.frameCoordinates.get(state.currentFrame + 1);
    if (!frameCoords) {
      frameCoords = this.calculateMatrixCenter(mocapData);
      this.frameCoordinates.set(state.currentFrame + 1, frameCoords);
    }

    // 生成完整矩阵
    const fullMatrix = this.generateFullMatrix({
      ...frame,
      center: frameCoords
    });
    
    // 发送到客户端
    await this.sendFrameData(ws, state, {
      frameIndex: state.currentFrame + 1,
      matrix: fullMatrix,
      coordinates: mocapData
    });

    // 发送到硬件
    await hardwareController.sendToHardware(fullMatrix, 'experiment');

    // 更新最后处理时间
    this.lastProcessTime.set(ws, currentTime);

    // 处理记录
    await this.processAndBufferFrame(state, {
      frameIndex: state.currentFrame + 1,
      mocapData,
      matrix: fullMatrix
    });

    // 清理旧的坐标缓存
    if (state.currentFrame > 1) {
      this.frameCoordinates.delete(state.currentFrame - 1);
    }
  } catch (error) {
    console.error('Error processing dynamic frame:', error);
  }
}


    // 生成完整的36*36 PWM矩阵
   generateFullMatrix(frame) {
    if (!frame) return null;
    
    // 初始化36*36矩阵，使用背景PWM值填充
    const fullMatrix = Array(36).fill().map(() => 
      Array(36).fill(frame.backgroundPWM)
    );

    const { matrix, windMatrixWidth, windMatrixHeight } = frame;
    
    // 确保center存在，如果不存在使用默认中心点
    let centerX, centerY;
    if (!frame.center || frame.center.length !== 2) {
      centerX = Math.floor(36 / 2);
      centerY = Math.floor(36 / 2);
      console.warn('Using default center point:', [centerX, centerY]);
    } else {
      [centerX, centerY] = frame.center;
    }

    // 计算风效矩阵的起始位置
    const startX = Math.max(0, Math.min(36 - windMatrixWidth, 
      Math.floor(centerX - windMatrixWidth / 2)));
    const startY = Math.max(0, Math.min(36 - windMatrixHeight, 
      Math.floor(centerY - windMatrixHeight / 2)));

    // 复制风效矩阵到对应位置
    for (let y = 0; y < windMatrixHeight; y++) {
      const fullY = startY + y;
      if (fullY >= 0 && fullY < 36) {
        for (let x = 0; x < windMatrixWidth; x++) {
          const fullX = startX + x;
          if (fullX >= 0 && fullX < 36) {
            fullMatrix[fullY][fullX] = matrix[y][x];
          }
        }
      }
    }

    return fullMatrix;
  }

    // 从动捕数据计算矩阵中心点坐标
    calculateMatrixCenter(mocapData) {
        const [x, y] = mocapData.position;
        
        // 将物理坐标(-2000~2000)转换为矩阵坐标(0~36)
        const matrixX = Math.floor(((x + 2000) / 4000) * 36);
        const matrixY = Math.floor(((y + 2000) / 4000) * 36);
        
        // 边界检查
        return [
            Math.max(0, Math.min(35, matrixX)),
            Math.max(0, Math.min(35, matrixY))
        ];
    }

    // 保存一帧记录到CSV文件
    async saveFrameRecord(state, frameData) {
      if (!state.recordPath || !state.recordStartTime) return;
  
      const { frameIndex, mocapData, matrix } = frameData;
  
      // 检查是否是重复帧
      if (state.frameSet.has(frameIndex)) {
          console.log(`重复帧已跳过: ${frameIndex}`);
          return;
      }
  
      const time = new Date(
          new Date(state.recordStartTime).getTime() + 
          frameIndex * this.frameInterval
      ).toISOString();
  
      // 格式化坐标数据
      const [x, y, z] = mocapData.position;
      
      // 将矩阵转换为字符串，保持格式一致性
      const matrixStr = JSON.stringify(matrix).replace(/\n/g, '');
  
      // 构建CSV行
      const csvLine = `${frameIndex},${time},${x},${y},${z},${matrixStr}\n`;
  
      try {
          await fs.appendFile(state.recordPath, csvLine, 'utf8');
          // 添加到已记录帧集合
          state.frameSet.add(frameIndex);
      } catch (error) {
          console.error('Error saving record:', error);
      }
  }

    // 发送帧数据到客户端
    async sendFrameData(ws, state, frameData) {
        const message = {
            type: 'FRAME',
            ...frameData,
            coordinates: {
              position: frameData.coordinates.position,
              markers: {
                  Marker1: frameData.coordinates.Marker1,
                  Marker2: frameData.coordinates.Marker2,
                  Marker3: frameData.coordinates.Marker3,
                  Marker4: frameData.coordinates.Marker4
              }
          }
        };

        // 发送到客户端
        ws.send(JSON.stringify(message));

        // 如果开启了终端,也发送到终端
        if (state.hasTerminal) {
            ws.send(JSON.stringify({
                type: 'MATRIX_UPDATE',
                frameIndex: frameData.frameIndex,
                matrix: JSON.stringify(frameData.matrix),
                coordinates: {
                  x: frameData.coordinates.position[0],
                  y: frameData.coordinates.position[1],
                  z: frameData.coordinates.position[2]
              }
            }));
        }
    }

    // 更新播放状态
    updatePlaybackState(ws, state) {
        ws.send(JSON.stringify({
            type: 'PLAYBACK_STATE_UPDATE',
            playbackState: {
                isPlaying: state.isPlaying,
                isPaused: state.isPaused,
                currentFrame: state.currentFrame
            }
        }));
    }
}

module.exports = ExperimentPlayer;