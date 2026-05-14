// server/routes/windProcessRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { transformDataWithInterpolation } = require('../utils/deal');

const router = express.Router();

router.post('/process/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const csvPath = path.join(
      process.cwd(),
      'data/csv_files/test',
      filename
    );
    
    if (!await fs.pathExists(csvPath)) {
      throw new Error('CSV文件不存在');
    }

    const jsonFilename = filename.replace('.csv', '.json');
    const outputPath = path.join(
      process.cwd(),
      'data/csv_files/test',
      jsonFilename
    );

    // 清理旧的输出文件
    if (await fs.pathExists(outputPath)) {
      await fs.unlink(outputPath);
    }

    // 清理所有模块缓存
    Object.keys(require.cache).forEach(function(key) {
      delete require.cache[key];
    });

    await transformDataWithInterpolation(csvPath, outputPath);
    
    res.json({
      success: true,
      message: 'CSV处理成功',
      outputFile: jsonFilename
    });
  } catch (error) {
    console.error('CSV处理失败:', error);
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
});

router.get('/processed/:filename', async (req, res) => {
  try {
    // 添加禁用缓存的头部
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Expires': '0',
      'Pragma': 'no-cache'
    });
    const { filename } = req.params;
    const filePath = path.join(
      process.cwd(),
      'data/csv_files/test',
      filename.replace('.csv', '.json')
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

// 为片段处理添加的新路由
router.post('/fragment/:projectId/:fragmentId/process', async (req, res) => {
  try {
    const { projectId, fragmentId } = req.params;
    const fragmentDir = path.join(
      process.cwd(),
      'data/projects',
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );
    const infoPath = path.join(fragmentDir, 'info.json');

    // 读取片段信息获取配置文件
    const info = await fs.readJson(infoPath);
    if (!info.windConfigFile) {
      throw new Error('未找到风片段配置文件');
    }

    // 构建CSV路径
    const csvPath = path.join(
      process.cwd(),
      'data/csv_files/fragment',
      info.windConfigFile
    );
    
    if (!await fs.pathExists(csvPath)) {
      throw new Error('CSV文件不存在');
    }

    // 生成输出文件名
    const jsonFilename = `fragment-${fragmentId}-${Date.now()}.json`;
    const outputPath = path.join(
      process.cwd(),
      'data/csv_files/fragment',
      jsonFilename
    );

    // 清理旧的输出文件
    if (await fs.pathExists(outputPath)) {
      await fs.unlink(outputPath);
    }

    // 清理模块缓存
    Object.keys(require.cache).forEach(function(key) {
      delete require.cache[key];
    });

    // 处理文件
    await transformDataWithInterpolation(csvPath, outputPath);
    
    res.json({
      success: true,
      message: 'CSV处理成功',
      outputFile: jsonFilename
    });
  } catch (error) {
    console.error('处理失败:', error);
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
});

// 获取处理后的文件内容
router.get('/fragment/:projectId/:fragmentId/processed/:filename', async (req, res) => {
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

// 添加片段专用的处理路由
router.get('/fragment/processed/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(
      process.cwd(),
      'data/csv_files/fragment',
      filename.replace('.csv', '.json')
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

// 添加自动处理片段配置文件的路由
router.post('/fragment/process', async (req, res) => {
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

module.exports = router;