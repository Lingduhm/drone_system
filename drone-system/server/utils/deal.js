const fs = require('fs-extra');
const transitionLoader = require('./transitionLoader');
const path = require('path');
const readline = require('readline');

/**
 * 加载风型生成函数
 * @param {string} windID - 风型ID
 * @returns {Function|null} 返回风型生成函数或null
 */
async function loadWindGenerator(windID) {
  try {
    const templatePath = path.join(
      process.cwd(),
      'data',
      'templates',
      `template-${windID}`
    );

    const files = await fs.promises.readdir(templatePath);
    const jsFile = files.find(file =>
      file.endsWith('.js') && file !== 'info.json'
    );

    if (!jsFile) {
      throw new Error(`找不到模板 ${windID} 的配置文件`);
    }

    const configPath = path.join(templatePath, jsFile);
    const resolvedPath = require.resolve(configPath);
    delete require.cache[resolvedPath];

    const module = require(configPath);
    const { generateWindMatrix } = module;

    if (typeof generateWindMatrix !== 'function') {
      throw new Error(`模板 ${windID} 的配置文件未提供 generateWindMatrix 函数`);
    }

    return generateWindMatrix;
  } catch (error) {
    console.error(`加载风型生成函数失败: ${error.message}`);
    throw error;
  }
}

/**
 * 流式读取CSV文件的生成器函数
 * @param {string} filePath - CSV文件路径
 * @param {Function} windGenerator - 风型生成函数
 * @param {string} windID - 风型ID
 */
async function* readCSVStream(filePath, windGenerator, windID) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  let headers;
  let isFirstLine = true;
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue; // 跳过第一行(windID)

    if (!headers) {
      headers = line.split(',').map(h => h.trim());
      continue;
    }

    if (line.trim() === '') continue;

    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index];
      }
    });

    if (
      row.centerX === 'x' || row.centerX === 'y' ||
      row.centerY === 'x' || row.centerY === 'y'
    ) {
      row.dynamicCenter = true;
      row.centerOriginal = "xy";
      row.centerX = 18;
      row.centerY = 18;
    } else {
      row.dynamicCenter = false;
      const cx = parseInt(row.centerX, 10);
      const cy = parseInt(row.centerY, 10);
      row.centerOriginal = [cx, cy];
      row.centerX = cx;
      row.centerY = cy;
    }

    yield row;
  }
}

/**
 * 从CSV文件读取并解析数据 (原有同步读取方法保持不变)
 * @param {string} filePath - CSV文件路径
 * @returns {Object} 包含windID和解析后数据的对象
 */
async function readCompleteCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');

  const firstLineColumns = lines[0].split(',');
  const windID = firstLineColumns[1] ? firstLineColumns[1].trim() : '';

  if (!windID) {
    throw new Error('CSV文件必须在第一行指定windID');
  }

  const windGenerator = await loadWindGenerator(windID);
  if (!windGenerator) {
    throw new Error(`无法加载风型ID ${windID} 的生成函数`);
  }

  const headers = lines[1].split(',').map(h => h.trim());
  const data = [];

  for (let i = 2; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index];
      }
    });

    if (
      row.centerX === 'x' || row.centerX === 'y' ||
      row.centerY === 'x' || row.centerY === 'y'
    ) {
      row.dynamicCenter = true;
      row.centerOriginal = "xy";
      row.centerX = 18;
      row.centerY = 18;
    } else {
      row.dynamicCenter = false;
      const cx = parseInt(row.centerX, 10);
      const cy = parseInt(row.centerY, 10);
      row.centerOriginal = [cx, cy];
      row.centerX = cx;
      row.centerY = cy;
    }

    data.push(row);
  }

  return { windID, windGenerator, data };
}

/**
 * 分批处理转换数据的辅助函数
 */
async function processBatchData(batchData, windGenerator, windID) {
  if (batchData.length === 0) return [];
  
  const transformedData = [];
  for (let i = 0; i < batchData.length - 1; i++) {
    const currentRow = batchData[i];
    const nextRow = batchData[i + 1];
    const duration = parseFloat(nextRow['timeline']) - parseFloat(currentRow['timeline']);

    const newItem = {
      duration: parseFloat(duration.toFixed(1)),
      isDynamicCenter: currentRow.dynamicCenter,
      staticCenter: currentRow.dynamicCenter ? null : currentRow.centerOriginal,
      center: currentRow.centerOriginal,
      width: parseInt(currentRow['width']),
      height: parseInt(currentRow['height']),
      windID,
      values: {},
      windGenerator
    };

    Object.keys(currentRow).forEach(key => {
      if (key.startsWith('value')) {
        const valueNum = key.slice(5);
        const easingKey = 'easing' + valueNum;
        newItem.values[key] = {
          start: parseInt(currentRow[key]),
          end: parseInt(nextRow[key]),
          transitionId: nextRow[easingKey]
        };
      }
    });

    transformedData.push(newItem);
  }

  return transformedData;
}

/**
 * 计算过渡值序列
 */
async function calculateTransition(startValue, endValue, duration, transitionId, fps = 100) {
  try {
    const transitionFn = await transitionLoader.loadTransition(transitionId);
    const frames = Math.max(1, Math.floor(duration * fps));
    const values = [];

    for (let i = 0; i <= frames; i++) {
      const t = i / frames;
      const value = startValue + (endValue - startValue) * transitionFn(t);
      const clampedValue = Math.max(0, Math.min(value, 100000));
      values.push(Math.round(clampedValue));
    }

    return values;
  } catch (error) {
    console.error('计算过渡值失败:', error);
    throw error;
  }
}

/**
 * 处理风型矩阵
 */
async function processWindMatrix(matrix) {
  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] < min) min = matrix[y][x];
      if (matrix[y][x] > max) max = matrix[y][x];
    }
  }

  return matrix.map(row =>
    row.map(value => Math.floor(((value - min) / (max - min)) * 255))
  );
}

/**
 * 重新计算中心点位置
 */
function recenterPosition(centerX, centerY, width, height) {
  return [
    Math.max(0, Math.min(35, Math.round(centerX))),
    Math.max(0, Math.min(35, Math.round(centerY)))
  ];
}

/**
 * 补帧处理函数
 */
async function interpolateFrames(transformedData, fps = 100) {
  const frames = [];
  let frameCount = 1;
  const matrixWidth = 36;
  const matrixHeight = 36;

  for (const segment of transformedData) {
    const frameNum = Math.ceil(segment.duration * fps);
    const transitionValues = {};
    
    for (const [valueKey, valueData] of Object.entries(segment.values)) {
      const values = await calculateTransition(
        valueData.start,
        valueData.end,
        segment.duration,
        valueData.transitionId,
        fps
      );
      transitionValues[valueKey] = values;
    }

    for (let i = 0; i < frameNum; i++) {
      const frame = {
        frameIndex: frameCount++,
        timeline: (i / fps).toFixed(3),
        isDynamicCenter: segment.isDynamicCenter
      };

      let numericCenterX, numericCenterY;
      if (segment.isDynamicCenter) {
        numericCenterX = 18;
        numericCenterY = 18;
      } else {
        numericCenterX = segment.staticCenter[0];
        numericCenterY = segment.staticCenter[1];
      }

      const computedCenter = recenterPosition(numericCenterX, numericCenterY, segment.width, segment.height, matrixWidth, matrixHeight);
      frame.computedCenter = computedCenter;
      frame.windMatrixWidth = segment.width;
      frame.windMatrixHeight = segment.height;

      const frameValues = {};
      const valueParams = [];
      Object.entries(transitionValues).forEach(([key, values]) => {
        const value = values[i];
        frameValues[key] = value;
        valueParams.push(value);
      });

      try {
        const { matrix: windMatrix, defaultPWMValue } = await segment.windGenerator(
          segment.width,
          segment.height,
          ...valueParams
        );

        const processedMatrix = await processWindMatrix(windMatrix);
        frame.pwmMatrix = processedMatrix;
        frame.backgroundPWM = defaultPWMValue;
        frame.center = segment.isDynamicCenter ? "xy" : computedCenter;

        Object.assign(frame, frameValues);
        frames.push(frame);
      } catch (error) {
        console.error('生成风型矩阵失败:', error);
        throw error;
      }
    }
  }
  return frames;
}

/**
 * 转换数据并进行补帧处理
 */
async function transformDataWithInterpolation(csvFilePath, outputPath) {
  try {
    const firstLine = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(csvFilePath),
        crlfDelay: Infinity
      });
      rl.once('line', (line) => {
        rl.close();
        resolve(line);
      });
    });

    const windID = firstLine.split(',')[1]?.trim();
    if (!windID) {
      throw new Error('CSV文件必须在第一行指定windID');
    }

    const windGenerator = await loadWindGenerator(windID);
    const writeStream = fs.createWriteStream(outputPath);
    writeStream.write('{\n');
    
    const BATCH_SIZE = 1000;
    let batchData = [];
    let totalFrames = 0;
    let firstBatch = true;

    for await (const row of readCSVStream(csvFilePath, windGenerator, windID)) {
      batchData.push(row);

      if (batchData.length >= BATCH_SIZE + 1) {
        const transformedData = await processBatchData(batchData, windGenerator, windID);
        const batchFrames = await interpolateFrames(transformedData);
        
        for (const frame of batchFrames) {
          if (!firstBatch) {
            writeStream.write(',\n');
          }
          
          const frameData = {
            center: frame.isDynamicCenter ? "xy" : frame.computedCenter,
            isDynamic: frame.isDynamicCenter,
            backgroundPWM: frame.backgroundPWM,
            windMatrixWidth: frame.windMatrixWidth,
            windMatrixHeight: frame.windMatrixHeight,
            matrix: frame.pwmMatrix
          };

          writeStream.write(`  "frame${frame.frameIndex}": ${JSON.stringify(frameData)}`);
          firstBatch = false;
          totalFrames++;
        }

        batchData = [batchData[batchData.length - 1]];
      }
    }

    if (batchData.length > 1) {
      const transformedData = await processBatchData(batchData, windGenerator, windID);
      const batchFrames = await interpolateFrames(transformedData);
      
      for (const frame of batchFrames) {
        if (!firstBatch) {
          writeStream.write(',\n');
        }
        
        const frameData = {
          center: frame.isDynamicCenter ? "xy" : frame.computedCenter,
          isDynamic: frame.isDynamicCenter,
          backgroundPWM: frame.backgroundPWM,
          windMatrixWidth: frame.windMatrixWidth,
          windMatrixHeight: frame.windMatrixHeight,
          matrix: frame.pwmMatrix
        };

        writeStream.write(`  "frame${frame.frameIndex}": ${JSON.stringify(frameData)}`);
        firstBatch = false;
        totalFrames++;
      }
    }

    writeStream.write('\n}');
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });

    return {
      windID,
      totalFrames
    };
  } catch (error) {
    console.error('数据转换错误:', error);
    throw error;
  }
}

module.exports = {
  transformDataWithInterpolation,
};
