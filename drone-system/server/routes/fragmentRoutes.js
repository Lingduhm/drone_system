// server/routes/fragmentRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { transformDataWithInterpolation } = require('../utils/deal');

// 获取片段的 PWM 数据
router.get('/:fragmentId/pwm', async (req, res) => {
  try {
    const { fragmentId } = req.params;
    
    // 找到对应的项目ID
    const projectsDir = path.join(process.cwd(), 'data/projects');
    let projectId;
    let fragmentInfo;

    // 遍历所有项目目录查找片段
    const projects = await fs.readdir(projectsDir);
    for (const project of projects) {
      const fragmentPath = path.join(
        projectsDir,
        project,
        'fragments',
        `fragment-${fragmentId}`,
        'info.json'
      );
      
      if (await fs.pathExists(fragmentPath)) {
        projectId = project.replace('project-', '');
        fragmentInfo = await fs.readJson(fragmentPath);
        break;
      }
    }

    if (!fragmentInfo) {
      throw new Error('未找到片段信息');
    }

    if (!fragmentInfo.processedPWMFile) {
      throw new Error('未找到处理后的 PWM 文件');
    }

    // 检查模板配置文件是否变更
    const templateDir = path.join(
      process.cwd(),
      'data/templates',
      `template-${fragmentInfo.templateInfo.templateId}`
    );
    const templateInfoPath = path.join(templateDir, 'info.json');
    const templateInfo = await fs.readJson(templateInfoPath);
    const currentConfigFile = templateInfo.configFile?.systemName;

    const needReprocess = !fragmentInfo.templateInfo ||
                         fragmentInfo.templateInfo.configFileName !== currentConfigFile;

    if (needReprocess) {
      // 重新处理 CSV 文件
      const csvPath = path.join(
        process.cwd(),
        'data/csv_files/fragment',
        fragmentInfo.windConfigFile
      );
      
      const jsonFilename = `fragment-${fragmentId}-${Date.now()}.json`;
      const outputPath = path.join(
        process.cwd(),
        'data/csv_files/fragment',
        jsonFilename
      );

      // 清理旧的 PWM 文件
      if (fragmentInfo.processedPWMFile) {
        const oldPWMPath = path.join(
          process.cwd(),
          'data/csv_files/fragment',
          fragmentInfo.processedPWMFile
        );
        if (await fs.pathExists(oldPWMPath)) {
          await fs.unlink(oldPWMPath);
        }
      }

      await transformDataWithInterpolation(csvPath, outputPath);

      // 更新片段信息
      fragmentInfo.processedPWMFile = jsonFilename;
      fragmentInfo.templateInfo = {
        templateId: fragmentInfo.templateInfo.templateId,
        configFileName: currentConfigFile
      };
      
      await fs.writeJson(path.join(
        projectsDir,
        `project-${projectId}`,
        'fragments',
        `fragment-${fragmentId}`,
        'info.json'
      ), fragmentInfo);

      res.json({
        success: true,
        needReprocess: true,
        processedFile: jsonFilename
      });
    } else {
      // 直接返回已有的处理文件
      res.json({
        success: true,
        needReprocess: false,
        processedFile: fragmentInfo.processedPWMFile
      });
    }
  } catch (error) {
    console.error('获取 PWM 数据失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 添加新的流式读取路由
router.get('/fragment/:fragmentId/stream-pwm/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(
      process.cwd(),
      'data/csv_files/fragment',
      filename
    );

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 设置响应头,支持分块传输
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 创建读取流
    const fileStream = fs.createReadStream(filePath, {
      encoding: 'utf8',
      highWaterMark: 64 * 1024 // 64KB chunks
    });

    // 流式处理JSON
    let buffer = '';
    let isFirstChunk = true;
    let frameCount = 0;

    fileStream.on('data', (chunk) => {
      buffer += chunk;
      
      // 处理缓冲区中的完整帧
      while (true) {
        const frameStart = buffer.indexOf('"frame');
        if (frameStart === -1) break;
        
        const frameEnd = buffer.indexOf('"frame', frameStart + 1);
        if (frameEnd === -1) break;

        // 提取一个完整的帧
        const frame = buffer.substring(frameStart, frameEnd);
        buffer = buffer.substring(frameEnd);

        // 发送帧数据
        if (isFirstChunk) {
          res.write('{"frames":[');
          isFirstChunk = false;
        } else {
          res.write(',');
        }
        res.write(frame);
        frameCount++;
      }
    });

    fileStream.on('end', () => {
      // 处理最后一帧
      if (buffer.length > 0) {
        if (!isFirstChunk) res.write(',');
        res.write(buffer);
        frameCount++;
      }
      
      // 完成JSON结构
      res.write(`],"totalFrames":${frameCount}}`);
      res.end();
    });

    fileStream.on('error', (error) => {
      console.error('读取文件流错误:', error);
      res.status(500).json({
        success: false,
        message: '读取文件失败'
      });
    });

  } catch (error) {
    console.error('流式读取失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 处理片段配置文件
router.post('/process', async (req, res) => {
  try {
    const { csvPath, fragmentId, projectId, templateId, forceProcess } = req.body;
    
    // 确保使用正确的完整CSV文件路径
    const fullCsvPath = path.join(process.cwd(), csvPath);
    
    if (!await fs.pathExists(fullCsvPath)) {
      throw new Error(`CSV文件不存在: ${fullCsvPath}`);
    }

    const fragmentDir = path.join(
      process.cwd(),
      'data/projects',
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );
    const fragmentInfoPath = path.join(fragmentDir, 'info.json');
    const fragmentInfo = await fs.readJson(fragmentInfoPath);

    // 获取当前模板的配置文件信息
    const templateDir = path.join(
      process.cwd(),
      'data/templates',
      `template-${templateId}`
    );
    const templateInfoPath = path.join(templateDir, 'info.json');
    const templateInfo = await fs.readJson(templateInfoPath);
    const currentConfigFile = templateInfo.configFile?.systemName;

    // 判断是否需要重新处理
    const needReprocess = !fragmentInfo.processedPWMFile || 
                         !fragmentInfo.templateInfo ||
                         fragmentInfo.templateInfo.configFileName !== currentConfigFile ||
                         forceProcess;

    if (needReprocess) {
      // 生成新的 PWM 文件名
      const jsonFilename = `fragment-${fragmentId}-${Date.now()}.json`;
      const outputPath = path.join(
        process.cwd(),
        'data/csv_files/fragment',
        jsonFilename
      );

      // 清理旧的 PWM 文件
      if (fragmentInfo.processedPWMFile) {
        const oldPWMPath = path.join(
          process.cwd(),
          'data/csv_files/fragment',
          fragmentInfo.processedPWMFile
        );
        if (await fs.pathExists(oldPWMPath)) {
          await fs.unlink(oldPWMPath);
        }
      }

      // 清理模块缓存
      Object.keys(require.cache).forEach(key => delete require.cache[key]);

      // 生成新的 PWM 文件
      await transformDataWithInterpolation(fullCsvPath, outputPath);

      // 更新片段信息
      fragmentInfo.processedPWMFile = jsonFilename;
      fragmentInfo.templateInfo = {
        templateId,
        configFileName: currentConfigFile
      };
      await fs.writeJson(fragmentInfoPath, fragmentInfo, { spaces: 2 });

      res.json({
        success: true,
        message: 'CSV处理成功',
        outputFile: jsonFilename
      });
    } else {
      // 如果不需要重新处理，返回已有的处理文件
      res.json({
        success: true,
        message: '使用已有处理文件',
        outputFile: fragmentInfo.processedPWMFile
      });
    }
  } catch (error) {
    console.error('处理失败:', error);
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
});

// 获取处理后的 PWM 文件内容
router.get('/processed/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(
      process.cwd(),
      'data/csv_files/fragment',
      filename
    );

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        message: '处理后的文件不存在'
      });
    }

    const content = await fs.readFile(filePath, 'utf8');
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('获取处理后文件失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:projectId/fragments/:fragmentId', async (req, res) => {
  try {
    const { projectId, fragmentId } = req.params;
    const fragmentDir = path.join(
      process.cwd(),
      'data/projects',
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );

    // 检查片段是否存在
    if (!await fs.pathExists(fragmentDir)) {
      return res.status(404).json({
        success: false,
        message: '片段不存在'
      });
    }

    // 删除片段目录及其所有内容
    await fs.remove(fragmentDir);

    res.json({
      success: true,
      message: '片段删除成功'
    });
  } catch (error) {
    console.error('删除片段失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除片段失败'
    });
  }
});

module.exports = router;