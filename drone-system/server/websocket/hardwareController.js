const dgram = require('dgram');
const net = require('net'); // 添加TCP Socket支持

class HardwareController {
  constructor() {
    this.socket = dgram.createSocket('udp4');
    this.tcpClients = new Map(); // 存储TCP客户端连接
    this.fanGroups = new Map();
    this.isSimulationMode = false;
    this.isFragmentSimulation = false;
    this.isExperimentMode = false;
    this.lastSendTime = new Map(); // 用于跟踪上次发送时间
    
    // 存储上一帧的矩阵数据
    this.previousMatrices = new Map();

    // 中转站配置
    this.bridgeConfig = {
      ip: '127.0.0.1',
      port: 3002 // 修改为中转站的端口
    };

    // 初始化144个接收端的IP和端口映射 - 使用ID 101-244
    for (let i = 101; i <= 244; i++) {
      this.fanGroups.set(i, {
        ip: '127.0.0.1',  // 测试时使用本地回环地址
        port: 3010       // 测试时使用同一端口
      });
      
      // 为每个接收端初始化一个空的上一帧数据
      this.previousMatrices.set(i, Array(9).fill(0));
    }

    this.socket.on('error', (err) => {
      console.error('UDP socket error:', err);
    });
  }

  // 连接到中转站 - 修改连接建立逻辑
  connectToBridge(clientId) {
    if (this.tcpClients.has(clientId)) {
      const client = this.tcpClients.get(clientId);
      // 检查连接是否仍然可用
      if (client.writable) {
        return client;
      } else {
        // 如果连接不可用，移除它
        this.tcpClients.delete(clientId);
      }
    }

    const client = new net.Socket();
    let isConnected = false;
    let idSent = false;

    client.connect(this.bridgeConfig.port, this.bridgeConfig.ip, () => {
      console.log(`Connected to bridge at ${this.bridgeConfig.ip}:${this.bridgeConfig.port} as client ${clientId}`);
      
      // 发送客户端ID，确保是短字符串，小于4字节
      const idStr = clientId.toString();
      client.write(idStr);
      
      // 标记ID已发送
      idSent = true;
      isConnected = true;
      
      console.log(`Client ID ${idStr} sent to bridge`);
      
      // 等待一段时间再发送数据，确保ID被正确处理
      setTimeout(() => {
        console.log(`Client ${clientId} ready for data transmission`);
      }, 100);
    });

    client.on('error', (err) => {
      console.error(`Bridge connection error for client ${clientId}:`, err);
      if (isConnected) {
        this.tcpClients.delete(clientId);
        setTimeout(() => this.connectToBridge(clientId), 5000); // 5秒后尝试重连
      }
    });

    client.on('close', () => {
      console.log(`Connection to bridge closed for client ${clientId}`);
      this.tcpClients.delete(clientId);
      if (isConnected) {
        setTimeout(() => this.connectToBridge(clientId), 5000); // 5秒后尝试重连
      }
    });

    client.on('data', (data) => {
      // 处理中转站返回的数据
      console.log(`Received data from bridge for client ${clientId}:`, data.toString());
    });

    this.tcpClients.set(clientId, client);
    return client;
  }

  // 检查客户端是否已连接并就绪
  isClientReady(clientId) {
    if (!this.tcpClients.has(clientId)) {
      return false;
    }
    
    const client = this.tcpClients.get(clientId);
    return client.writable;
  }

  setSimulationMode(enabled, source = 'test') {
    if (source === 'fragment') {
      this.isFragmentSimulation = enabled;
    } else if (source === 'experiment') {
      this.isExperimentMode = enabled;
    } else {
      this.isSimulationMode = enabled;
    }
    
    // 如果启用模拟模式，预先连接所有客户端
    if (enabled) {
      this.initializeAllClients();
    }
  }
  
  // 初始化所有客户端连接
  async initializeAllClients() {
    console.log("Initializing all client connections...");
    for (let clientId = 101; clientId <= 244; clientId++) {
      try {
        this.connectToBridge(clientId);
        // 添加小延迟避免一次性创建太多连接
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Failed to initialize client ${clientId}:`, error);
      }
    }
    console.log("All client connections initialized");
  }

  // 计算校验和
  calculateChecksum(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum & 0xFFFF; // 16位校验和
  }

  // 将3*3矩阵转换为数据包 - 新版本，用于中转站
  createDTPacket(matrix) {
    // 生成22字节的数据包: 2字节header + 18字节数据 + 2字节校验和
    const buffer = Buffer.alloc(22);
    
    // 设置Header ("DT")
    buffer.writeUInt8(0x44, 0); // "D"的ASCII
    buffer.writeUInt8(0x54, 1); // "T"的ASCII
    
    // 填充前9个字节 - PWM值
    for (let i = 0; i < 9; i++) {
      buffer.writeUInt8(matrix[i], i + 2);
    }
    
    // 后9个字节复制前9个字节的值
    for (let i = 0; i < 9; i++) {
      buffer.writeUInt8(matrix[i], i + 11);
    }

    // 计算校验和
    const headerAndData = Buffer.concat([
      buffer.slice(0, 2),     // Header
      buffer.slice(2, 20)     // Data
    ]);
    const checksum = this.calculateChecksum(headerAndData);
    buffer.writeUInt16LE(checksum, 20);

    return buffer;
  }

  // 将36*36矩阵切分为144个3*3矩阵
  splitMatrix(matrix) {
    const groups = [];
    for (let groupRow = 0; groupRow < 12; groupRow++) {
      for (let groupCol = 0; groupCol < 12; groupCol++) {
        const group = [];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const matrixRow = groupRow * 3 + row;
            const matrixCol = groupCol * 3 + col;
            group.push(matrix[matrixRow][matrixCol]);
          }
        }
        groups.push(group);
      }
    }
    return groups;
  }

  // 比较两个3*3矩阵是否完全相同
  compareMatrices(matrix1, matrix2) {
    if (!matrix1 || !matrix2 || matrix1.length !== matrix2.length) {
      return false;
    }
    return matrix1.every((value, index) => value === matrix2[index]);
  }

  // 发送PWM数据到硬件 - 修改为使用中转站，并控制发送频率
  async sendToHardware(matrix, source = 'test') {
    // 检查模拟模式
    if ((source === 'test' && !this.isSimulationMode) || 
        (source === 'fragment' && !this.isFragmentSimulation) ||
        (source === 'experiment' && !this.isExperimentMode)) {
      return;
    }

    // 获取当前时间
    const currentTime = Date.now();
    
    // 检查上次发送时间，确保每100ms发送一次
    const lastTime = this.lastSendTime.get(source) || 0;
    if (currentTime - lastTime < 100) {
      // 距离上次发送不到100ms，跳过这次发送
      return;
    }
    
    // 更新发送时间
    this.lastSendTime.set(source, currentTime);
    console.log(`Sending PWM matrix at ${new Date().toISOString()}`);

    const groups = this.splitMatrix(matrix);
    const sendPromises = [];
    
    // 按顺序发送到正确的ID (101-244)
    let clientId = 101;
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const thisClientId = clientId; // 捕获当前循环的clientId
      
      const promise = new Promise((resolve, reject) => {
        // 获取该组的上一帧数据
        const previousMatrix = this.previousMatrices.get(thisClientId);
        
        // 比较当前帧与上一帧
        if (this.compareMatrices(group, previousMatrix)) {
          // 如果完全相同，不发送数据
          resolve();
          return;
        }

        try {
          // 连接到中转站
          const client = this.connectToBridge(thisClientId);
          
          // 创建DT数据包
          const packet = this.createDTPacket(group);
          
          // 发送数据包
          client.write(packet);
          
          // 记录发送信息
          console.log(`Sent data to client ${thisClientId}`);
          
          // 更新上一帧数据
          this.previousMatrices.set(thisClientId, [...group]);
          resolve();
        } catch (error) {
          console.error(`Error sending to bridge for client ${thisClientId}:`, error);
          reject(error);
        }
      });
      
      sendPromises.push(promise);
      clientId++;
    }

    try {
      await Promise.all(sendPromises);
    } catch (error) {
      console.error('Error sending data to hardware:', error);
    }
  }

  // 清理资源
  cleanup() {
    this.previousMatrices.clear();
    this.lastSendTime.clear();
    
    // 关闭所有TCP连接
    for (const [clientId, client] of this.tcpClients.entries()) {
      try {
        client.end();
        console.log(`Closed connection to bridge for client ${clientId}`);
      } catch (error) {
        console.error(`Error closing connection for client ${clientId}:`, error);
      }
    }
    this.tcpClients.clear();
    
    if (this.socket) {
      this.socket.close();
    }
  }
}

module.exports = new HardwareController();