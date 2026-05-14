const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const readline = require('readline');

// 修改生成 CSV 内容的函数
function generateCSVContent({ fragmentInfo, startTime, duration, frames }) {
    // 基本信息部分
    const basicInfo = [
        `fragmentName,${fragmentInfo.title || 'Unknown Fragment'}`,
        `startTime,${startTime}`,
        `duration,${duration}`
    ].join('\n');

    // 添加一个空行分隔基本信息和数据部分
    const separator = '';

    // 数据部分表头
    const dataHeader = 'frameIndex,matrix';

    // 数据行部分
    const dataRows = frames.map(frame => 
        `${frame.frameIndex},${JSON.stringify(frame.matrix)}`
    );

    // 组合所有部分
    return [basicInfo, separator, dataHeader, ...dataRows].join('\n');
}

const validateRecordName = (name) => {
    // 计算字符串长度（一个汉字算2个长度）
    const getStringLength = (str) => {
      let length = 0;
      for (let i = 0; i < str.length; i++) {
        length += /[\u4e00-\u9fa5]/.test(str[i]) ? 2 : 1;
      }
      return length;
    };
  
    // 检查是否包含非法字符
    if (/[<>:"/\\|?*]/.test(name)) {
      return {
        valid: false,
        message: '名称不能包含特殊字符 < > : " / \\ | ? *'
      };
    }
  
    const length = getStringLength(name);
    if (length > 24) {
      return {
        valid: false,
        message: '名称过长（最多12个汉字或24个英文字符）'
      };
    }
  
    return { valid: true };
  };

  async function getMaxTrackNumber(recordsDir) {
    try {
      // 读取目录下所有文件
      const files = await fs.readdir(recordsDir);
      let maxNum = 0;
  
      // 遍历所有文件找出最大的 track 序号
      files.forEach(file => {
        if (file.startsWith('track-')) {
          const num = parseInt(file.match(/track-(\d+)\.csv$/)?.[1] || '0');
          maxNum = Math.max(maxNum, num);
        }
      });
  
      return maxNum;
    } catch (error) {
      console.error('获取最大 track 序号失败:', error);
      return 0;
    }
  }

// 添加获取记录PWM数据的路由
router.get('/api/records/:fragmentId/pwm/:recordName', async (req, res) => {
  const { fragmentId, recordName } = req.params;
  const { projectId } = req.query;

  if (!fragmentId || !recordName || !projectId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters'
    });
  }

  const recordPath = path.join(
    process.cwd(),
    'data/projects',
    `project-${projectId}`,
    'records',
    `fragment-${fragmentId}`,
    `${recordName}.csv`
  );

  try {
    if (!await fs.pathExists(recordPath)) {
      throw new Error('Record file not found');
    }

    // 使用两次读取：一次读取元数据，一次流式传输帧数据
    const metadata = await getMetadata(recordPath, fragmentId);
    
    // 设置响应头，表明这是一个流式响应
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 开始写入响应
    res.write('{"success":true,"metadata":');
    res.write(JSON.stringify(metadata));
    res.write(',"frames":[');

    let isFirstFrame = true;
    const fileStream = fs.createReadStream(recordPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) {
        if (line.startsWith('frameIndex,')) {
          isHeader = false;
        }
        continue;
      }

      if (line.startsWith('status,')) {
        continue;
      }

      try {
        const frame = parseFrameLine(line);
        if (frame) {
          if (!isFirstFrame) {
            res.write(',');
          }
          res.write(JSON.stringify(frame));
          isFirstFrame = false;
        }
      } catch (error) {
        console.warn(`Skip invalid frame data: ${error.message}`);
      }
    }

    // 完成响应
    res.write(']}');
    res.end();

  } catch (error) {
    console.error('获取记录PWM数据失败:', error);
    // 如果还没有开始写入响应，发送错误
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || '获取记录数据失败'
      });
    } else {
      // 如果已经开始写入，尝试优雅地结束响应
      res.write(']}');
      res.end();
    }
  }
});

// 解析单行帧数据
function parseFrameLine(line) {
  try {
    // 分隔CSV行，但保留中括号内的逗号
    const parts = line.split(/,(?![^[]*\])/);
    
    if (parts.length < 17) return null; // 至少需要16个坐标值和1个矩阵

    const frameIndex = parseInt(parts[0]);
    if (isNaN(frameIndex)) return null;

    // 解析坐标
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

    // 解析矩阵
    const matrixStr = parts[16];
    // 确保矩阵字符串格式正确
    if (!matrixStr || !matrixStr.startsWith('[[') || !matrixStr.endsWith(']]')) {
      return null;
    }
    
    // 解析二维数组
    const matrix = JSON.parse(matrixStr);

    return {
      frameIndex,
      coordinates,
      matrix
    };
  } catch (error) {
    console.warn(`Skip invalid frame data at frame ${frameIndex || 'unknown'}: ${error.message}`);
    return null;
  }
}

// 获取文件元数据
async function getMetadata(filePath, fragmentId) {
  return new Promise((resolve, reject) => {
    const metadata = {
      fragmentId,
      totalFrames: 0
    };

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    let isHeader = true;
    let frameCount = 0;

    rl.on('line', (line) => {
      if (line.startsWith('status,completed')) {
        rl.close();
        return;
      }

      if (line.startsWith('frameIndex,')) {
        isHeader = false;
        return;
      }

      if (isHeader) {
        // 处理头部信息，移除空字段
        const [key, value] = line.split(',').map(item => item.trim());
        if (key && value) {
          metadata[key] = value;
        }
      } else if (line.trim()) {
        frameCount++;
      }
    });

    rl.on('close', () => {
      metadata.totalFrames = frameCount;
      metadata.duration = frameCount / 100;
      resolve(metadata);
    });

    rl.on('error', reject);
  });
}

// 重命名记录
router.put('/api/records/:fragmentId/rename', async (req, res) => {
  try {
    const { fragmentId } = req.params;
    const { projectId, recordName, newName } = req.body;

    // 验证新名称
    const validation = validateRecordName(newName);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    const recordsDir = path.join(
      process.cwd(),
      'data',
      'projects',
      `project-${projectId}`,
      'records',
      `fragment-${fragmentId}`
    );

    const oldPath = path.join(recordsDir, `${recordName}.csv`);
    const newPath = path.join(recordsDir, `${newName}.csv`);

    // 检查新名称的文件是否已存在
    if (await fs.pathExists(newPath)) {
      return res.status(400).json({
        success: false,
        message: '该名称已存在'
      });
    }

    await fs.rename(oldPath, newPath);
    res.json({ success: true });
  } catch (error) {
    console.error('重命名记录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '重命名失败'
    });
  }
});
  
  // 删除记录
  router.delete('/api/records/:fragmentId/delete', async (req, res) => {
    try {
      const { fragmentId } = req.params;
      const { projectId, recordNames } = req.body;
      
      const recordsDir = path.join(
        process.cwd(),
        'data',
        'projects',
        `project-${projectId}`,
        'records',
        `fragment-${fragmentId}`
      );
  
      await Promise.all(
        recordNames.map(name =>
          fs.unlink(path.join(recordsDir, `${name}.csv`))
        )
      );
  
      res.json({ success: true });
    } catch (error) {
      console.error('删除记录失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  // 批量下载
  router.post('/api/records/:fragmentId/batch-download', async (req, res) => {
    try {
      const { fragmentId } = req.params;
      const { projectId, recordNames } = req.body;
      
      const recordsDir = path.join(
        process.cwd(),
        'data',
        'projects',
        `project-${projectId}`,
        'records',
        `fragment-${fragmentId}`
      );
  
      const archive = archiver('zip', { zlib: { level: 9 } });
      const zipFileName = `records_${Date.now()}.zip`;
      const zipFilePath = path.join(process.cwd(), 'temp', zipFileName);
  
      // 确保 temp 目录存在
      await fs.ensureDir(path.dirname(zipFilePath));
  
      const output = fs.createWriteStream(zipFilePath);
      archive.pipe(output);
  
      // 添加文件到压缩包
      for (const name of recordNames) {
        const filePath = path.join(recordsDir, `${name}.csv`);
        archive.file(filePath, { name: `${name}.csv` });
      }
  
      await archive.finalize();
  
      // 等待写入完成
      await new Promise(resolve => output.on('close', resolve));
  
      // 发送文件
      res.download(zipFilePath, zipFileName, (err) => {
        // 下载完成后删除临时文件
        fs.unlink(zipFilePath).catch(console.error);
      });
    } catch (error) {
      console.error('打包下载失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

// 保存新的实验记录
router.post('/api/records/:fragmentId', async (req, res) => {
    try {
      const { fragmentId } = req.params;
      const recordData = req.body;
  
      // 数据验证
      if (!recordData.projectId || !fragmentId) {
        throw new Error('Missing projectId or fragmentId');
      }
  
      // 构建记录目录路径
      const recordsDir = path.join(
        process.cwd(),
        'data',
        'projects',
        `project-${recordData.projectId}`,
        'records',
        `fragment-${fragmentId}`
      );
  
      // 确保目录存在
      await fs.ensureDir(recordsDir);
  
      // 获取最大的 track 序号并加1
      const maxTrackNum = await getMaxTrackNumber(recordsDir);
      const newTrackNum = maxTrackNum + 1;
      const recordName = `track-${newTrackNum}`;
  
      // 创建记录文件
      const recordPath = path.join(recordsDir, `${recordName}.csv`);
      
      // 生成并写入 CSV 内容
      const csvContent = generateCSVContent(recordData);
      await fs.writeFile(recordPath, csvContent, 'utf8');
  
      res.json({
        success: true,
        recordName,
        message: '记录保存成功',
        recordCount: newTrackNum
      });
    } catch (error) {
      console.error('保存记录失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

// 修改获取记录列表的路由,适应新的 CSV 格式
router.get('/api/records/:fragmentId', async (req, res) => {
  try {
      const { fragmentId } = req.params;
      const { projectId } = req.query;
      
      if (!projectId) {
          throw new Error('Missing projectId parameter');
      }

      const recordsDir = path.join(
          process.cwd(),
          'data',
          'projects',
          `project-${projectId}`,
          'records',
          `fragment-${fragmentId}`
      );

      if (!await fs.pathExists(recordsDir)) {
          return res.json([]);
      }

      const files = await fs.readdir(recordsDir);
      const records = await Promise.all(
          files.filter(file => file.endsWith('.csv'))
              .map(async file => {
                  const filePath = path.join(recordsDir, file);
                  
                  try {
                      // 使用流式读取,只读取文件开头和结尾
                      const headerLines = [];
                      const footerLines = [];
                      let isHeader = true;
                      let lineCount = 0;
                      
                      const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
                      const rl = readline.createInterface({
                          input: readStream,
                          crlfDelay: Infinity
                      });

                      for await (const line of rl) {
                          if (isHeader) {
                              headerLines.push(line);
                              if (line.startsWith('frameIndex,')) {
                                  isHeader = false;
                              }
                          } else if (line.startsWith('status,')) {
                              // 开始读取footer
                              footerLines.push(line);
                              // 继续读取剩余的footer行
                              for await (const footerLine of rl) {
                                  footerLines.push(footerLine);
                              }
                              break;
                          }
                          lineCount++;
                      }

                      // 解析开始时间
                      const startTimeLine = headerLines.find(line => line.startsWith('startTime,'));
                      const startTime = startTimeLine ? startTimeLine.split(',')[1] : '';

                      // 从totalFrames计算时长
                      const totalFramesLine = footerLines.find(line => line.startsWith('totalFrames,'));
                      const totalFrames = totalFramesLine ? parseInt(totalFramesLine.split(',')[1]) : 0;
                      const duration = totalFrames ? `${(totalFrames / 100).toFixed(2)}s` : '0s';
                      
                      return {
                          name: file.replace('.csv', ''),
                          time: startTime,
                          duration: duration
                      };
                  } catch (error) {
                      console.error('Error processing record file:', file, error);
                      return null;
                  }
              })
      );

      res.json(records.filter(Boolean));
  } catch (error) {
      console.error('获取记录列表失败:', error);
      res.status(500).json([]);
  }
});

    
// 下载记录文件路由保持不变
router.get('/api/records/:fragmentId/download/:recordName', async (req, res) => {
    try {
        const { fragmentId, recordName } = req.params;
        const { projectId } = req.query;

        if (!projectId) {
            throw new Error('Missing projectId parameter');
        }

        const filePath = path.join(
            process.cwd(),
            'data',
            'projects',
            `project-${projectId}`,
            'records',
            `fragment-${fragmentId}`,
            `${recordName}.csv`
        );

        if (!await fs.pathExists(filePath)) {
            throw new Error('Record file not found');
        }

        res.download(filePath);
    } catch (error) {
        console.error('下载记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 新增：获取记录文件的详细信息（用于回放）
router.get('/api/records/:fragmentId/playback/:recordName', async (req, res) => {
  try {
    const { fragmentId, recordName } = req.params;
    const { projectId } = req.query;

    if (!fragmentId || !recordName || !projectId) {
      throw new Error('Missing required parameters');
    }

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

    const content = await fs.readFile(recordPath, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    // 解析元数据
    const metadata = {
      fragmentName: lines[0].split(',')[1],
      startTime: lines[1].split(',')[1],
      duration: parseFloat(lines[2].split(',')[1])
    };

    // 查找数据部分的起始位置
    const dataStartIndex = lines.findIndex(line => line === 'frameIndex,matrix') + 1;
    
    // 解析帧数据总数
    const totalFrames = lines.length - dataStartIndex;

    res.json({
      success: true,
      metadata: {
        ...metadata,
        fragmentId,
        totalFrames
      }
    });

  } catch (error) {
    console.error('Failed to get record playback info:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get record info'
    });
  }
});


module.exports = router;