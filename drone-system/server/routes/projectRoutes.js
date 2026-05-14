// server/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

// 删除项目路由 - 注意这里不需要/api/projects前缀，因为已经在app.use中指定了
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(
      process.cwd(),
      'data/projects',
      `project-${projectId}`
    );

    // 检查项目是否存在
    if (!await fs.pathExists(projectDir)) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 删除项目目录及其所有内容
    await fs.remove(projectDir);

    res.json({
      success: true,
      message: '项目删除成功'
    });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除项目失败'
    });
  }
});

module.exports = router;