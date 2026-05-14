// server/routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

// 删除模板路由
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateDir = path.join(
      process.cwd(),
      'data/templates',
      `template-${templateId}`
    );

    // 检查模板是否存在
    if (!await fs.pathExists(templateDir)) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 删除模板目录及其所有内容
    await fs.remove(templateDir);

    res.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除模板失败'
    });
  }
});

module.exports = router;