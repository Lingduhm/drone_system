const express = require('express');
const WebSocket = require('ws');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const windProcessRoutes = require('./routes/windProcessRoutes');
const readline = require('readline');
const fragmentRoutes = require('./routes/fragmentRoutes');
const recordsRoutes = require('./routes/recordsRoutes');
const PWMPlayer = require('./websocket/pwmPlayer');
const ExperimentPlayer = require('./websocket/experimentPlayer');
const projectRoutes = require('./routes/projectRoutes');
const templateRoutes = require('./routes/templateRoutes');
const hardwareController = require('./websocket/hardwareController');

const app = express();

// 基础路径定义和目录初始化
const DATA_DIR = path.join(__dirname, '../data');
const CSV_DIR = path.join(DATA_DIR, 'csv_files');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
let ADMIN_PASSWORD;
try {
  if (fs.existsSync(SETTINGS_PATH)) {
    const settingsContent = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const settings = JSON.parse(settingsContent);
    ADMIN_PASSWORD = settings.password;
  }
} catch (error) {
  console.error('Error reading admin password from settings.json:', error);
  ADMIN_PASSWORD = null;
}

// 确保目录结构存在
[
  path.join(DATA_DIR, 'projects'),
  path.join(DATA_DIR, 'templates'),
  path.join(CSV_DIR, 'test'),
  path.join(CSV_DIR, 'fragment')
].forEach(dir => fs.ensureDirSync(dir));

// 确保 settings.json 存在
if (!fs.existsSync(SETTINGS_PATH)) {
  fs.writeJsonSync(SETTINGS_PATH, {
    created: new Date().toISOString()
  });
}

// Multer 配置

// 2. 项目文档上传配置
const docStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { projectId } = req.params;
    const projectDir = path.join(DATA_DIR, 'projects', `project-${projectId}`);
    fs.ensureDirSync(projectDir);
    
    // 清理旧文档
    try {
      const files = fs.readdirSync(projectDir);
      files.forEach(f => {
        if (f.endsWith('.md')) {
          fs.unlinkSync(path.join(projectDir, f));
        }
      });
    } catch (err) {
      console.error('清理旧文档失败:', err);
    }
    
    cb(null, projectDir);
  },
  filename: (req, file, cb) => {
    console.log('Original filename:', file.originalname);
    console.log('Multer file:', file);
    cb(null, file.originalname);
  }
});

// 3. 片段文档上传配置
const fragmentDocStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { projectId, fragmentId } = req.params;
    const fragmentDir = path.join(
      DATA_DIR, 
      'projects', 
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );
    fs.ensureDirSync(fragmentDir);
    
    // 清理旧文档
    try {
      const files = fs.readdirSync(fragmentDir);
      files.forEach(f => {
        if (f.endsWith('.md')) {
          fs.unlinkSync(path.join(fragmentDir, f));
        }
      });
    } catch (err) {
      console.error('清理旧文档失败:', err);
    }
    
    cb(null, fragmentDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

// 4. 模板文档上传配置
const templateDocStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { templateId } = req.params;
    const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`);
    
    // 确保目录存在
    fs.ensureDirSync(templateDir);
    
    // 清理旧文档
    try {
      const files = fs.readdirSync(templateDir);
      files.forEach(f => {
        if (f.endsWith('.md')) {
          fs.unlinkSync(path.join(templateDir, f));
        }
      });
    } catch (err) {
      console.error('清理旧文档失败:', err);
    }
    
    cb(null, templateDir);
  },
  filename: (req, file, cb) => {
    console.log('保存文件:', file.originalname);
    cb(null, file.originalname);
  }
});

// 5. 模板配置文件上传配置
const templateConfigStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { templateId } = req.params;
    const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`);
    fs.ensureDirSync(templateDir);
    
    // 清理旧配置文件
    try {
      const files = fs.readdirSync(templateDir);
      files.forEach(f => {
        if ((f.endsWith('.js') || f.endsWith('.json')) && f !== 'info.json') {
          fs.unlinkSync(path.join(templateDir, f));
        }
      });
    } catch (err) {
      console.error('清理旧配置文件失败:', err);
    }
    
    cb(null, templateDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = originalName.split('.').pop();
    const newFileName = `wind_${timestamp}.${extension}`;

    // 保存信息到 info.json
    try {
      const templateId = req.params.templateId;
      const infoPath = path.join(DATA_DIR, 'templates', `template-${templateId}`, 'info.json');
      let info = {};
      if (fs.existsSync(infoPath)) {
        info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      }
      info.configFile = {
        originalName: originalName,
        systemName: newFileName
      };
      fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
    } catch (err) {
      console.error('更新 info.json 失败:', err);
    }
    
    cb(null, newFileName);
  }
});

// 1. 片段CSV文件上传配置
const fragmentCsvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { projectId, fragmentId, type } = req.params;
    const uploadPath = path.join(CSV_DIR, 'fragment');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const { fragmentId } = req.params;
    const timestamp = Date.now();
    const filename = `${timestamp}-${fragmentId}-${file.originalname}`;
    cb(null, filename);
  }
});

// 添加测试文件上传配置
const testCsvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'data/csv_files/test');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 上传的CSV文件命名规则: timestamp-原文件名
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  }
});

// Multer 实例

const uploadDoc = multer({ storage: docStorage });
const uploadFragmentDoc = multer({ storage: fragmentDocStorage });
const uploadTemplateDoc = multer({ storage: templateDocStorage });
const uploadTemplateConfig = multer({ storage: templateConfigStorage });
const uploadFragmentCsv = multer({ storage: fragmentCsvStorage });
const uploadTestCsv = multer({ storage: testCsvStorage });

// 中间件
app.use(cors());
app.use(express.json({ limit: '100mb', extended: true })); 
app.use(express.urlencoded({ limit: '100mb', extended: true })); // 设置表单请求体的大小限制为 10MB
app.use((req, res, next) => {
  // 设置较长的超时时间，用于处理大文件
  req.setTimeout(30 * 60 * 1000); // 30分钟
  res.setTimeout(30 * 60 * 1000); // 30分钟
  next();
});
app.use('/api/fragment', fragmentRoutes);
app.use('/api/wind', windProcessRoutes);
app.use('/', recordsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/projects', require('./routes/fragmentRoutes'));

app.get('/api/csv/firstline/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(CSV_DIR, 'fragment', filename);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 使用 readline 读取第一行
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const reader = readline.createInterface({ input: fileStream });
    
    // 通过 Promise 处理异步读取
    const firstLine = await new Promise((resolve) => {
      reader.once('line', (line) => {
        reader.close();
        resolve(line);
      });
    });

    // 处理读取到的第一行
    const fields = firstLine.split(',');
    
    // 检查第一列是否为 wind(ID)
    if (fields[0]?.trim() !== 'wind(ID)') {
      return res.status(400).json({
        success: false,
        message: 'CSV文件格式错误：第一列必须为wind(ID)'
      });
    }

    // 检查第二列是否存在且非空
    if (!fields[1] || fields[1].trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'CSV文件格式错误：未找到模板ID'
      });
    }

    // 返回成功结果
    res.json({
      success: true,
      templateId: fields[1].trim()
    });
  } catch (error) {
    console.error('读取文件失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 添加密码验证路由
app.post('/api/projects/:projectId/verify', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { password } = req.body;

    // 检查是否成功读取到超管密码
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      return res.json({ success: true });
    }

    // 检查项目密码
    const projectDir = path.join(DATA_DIR, 'projects', `project-${projectId}`);
    const infoPath = path.join(projectDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    const projectInfo = await fs.readJson(infoPath);
    if (password === projectInfo.password) {
      res.json({ success: true });
    } else {
      res.json({ 
        success: false, 
        message: '密码错误'
      });
    }
  } catch (error) {
    console.error('验证密码失败:', error);
    res.status(500).json({
      success: false,
      message: '验证密码失败'
    });
  }
});

// 项目相关路由
// 1. 获取所有项目
app.get('/api/projects', async (req, res) => {
  try {
    const projectsDir = path.join(DATA_DIR, 'projects');
    await fs.ensureDir(projectsDir);
    
    const dirs = await fs.readdir(projectsDir);
    const projects = await Promise.all(
      dirs.map(async dir => {
        const infoPath = path.join(projectsDir, dir, 'info.json');
        if (await fs.pathExists(infoPath)) {
          try {
            const data = await fs.readJson(infoPath);
            return {
              ...data,
              id: dir.replace('project-', '')
            };
          } catch (err) {
            console.error(`读取项目文件失败: ${infoPath}`, err);
            return null;
          }
        }
        return null;
      })
    );

    res.json(projects.filter(Boolean));
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

// 2. 创建新项目
app.post('/api/projects', async (req, res) => {
  const projectId = Date.now().toString(36);
  const projectDir = path.join(DATA_DIR, 'projects', `project-${projectId}`);
  
  try {
    await fs.ensureDir(projectDir);
    await fs.ensureDir(path.join(projectDir, 'fragments'));
    await fs.ensureDir(path.join(projectDir, 'records'));
    
    await fs.writeJson(path.join(projectDir, 'info.json'), {
      id: projectId,
      ...req.body,
      createTime: new Date().toISOString()
    });

    res.json({ 
      success: true,
      id: projectId 
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({ error: '创建项目失败' });
  }
});

// 3. 项目文档处理
app.post('/api/projects/:projectId/document', uploadDoc.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: '没有收到文件' 
    });
  }
  
  res.json({
    success: true,
    message: '文档上传成功',
    filename: req.file.filename
  });
});

app.get('/api/projects/:projectId/document', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(DATA_DIR, 'projects', `project-${projectId}`);
    
    const files = await fs.readdir(projectDir);
    const mdFile = files.find(file => file.endsWith('.md'));

    if (!mdFile) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    const docPath = path.join(projectDir, mdFile);
    const content = await fs.readFile(docPath, 'utf8');
    
    res.json({
      success: true,
      filename: mdFile,
      content
    });
  } catch (error) {
    console.error('获取文档失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文档失败'
    });
  }
});

app.post('/api/projects/:projectId/fragments/:fragmentId/verify', async (req, res) => {
  try {
    const { projectId, fragmentId } = req.params;
    const { password } = req.body;

    // 检查是否成功读取到超管密码
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      return res.json({ success: true });
    }

    // 检查片段密码
    const fragmentDir = path.join(
      DATA_DIR,
      'projects',
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );
    const infoPath = path.join(fragmentDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '片段不存在'
      });
    }

    const fragmentInfo = await fs.readJson(infoPath);
    if (password === fragmentInfo.password) {
      res.json({ success: true });
    } else {
      res.json({ 
        success: false, 
        message: '密码错误'
      });
    }
  } catch (error) {
    console.error('验证密码失败:', error);
    res.status(500).json({
      success: false,
      message: '验证密码失败'
    });
  }
});

// 4. 获取项目片段列表
app.get('/api/projects/:projectId/fragments', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const fragmentsDir = path.join(DATA_DIR, 'projects', `project-${projectId}`, 'fragments');

    if (!await fs.pathExists(fragmentsDir)) {
      await fs.ensureDir(fragmentsDir);
      return res.json([]);
    }

    const fragmentFolders = await fs.readdir(fragmentsDir);
    const fragments = await Promise.all(
      fragmentFolders.map(async folder => {
        const infoPath = path.join(fragmentsDir, folder, 'info.json');
        try {
          if (await fs.pathExists(infoPath)) {
            return await fs.readJson(infoPath);
          }
        } catch (err) {
          console.error('读取片段文件失败:', err);
          return null;
        }
      })
    );

    res.json(fragments.filter(Boolean));
  } catch (error) {
    console.error('获取片段列表失败:', error);
    res.status(500).json([]);
  }
});

// 5. 创建新片段
app.post('/api/projects/:projectId/fragments', async (req, res) => {
  const { projectId } = req.params;
  const fragmentId = Date.now().toString(36);
  const fragmentDir = path.join(
    DATA_DIR, 
    'projects', 
    `project-${projectId}`,
    'fragments', 
    `fragment-${fragmentId}`
  );
  
  try {
    await fs.ensureDir(fragmentDir);
    await fs.writeJson(path.join(fragmentDir, 'info.json'), {
      id: fragmentId,
      projectId,
      ...req.body,
      createTime: new Date().toISOString()
    });

    res.json({ 
      success: true,
      id: fragmentId 
    });
  } catch (error) {
    console.error('创建片段失败:', error);
    res.status(500).json({ error: '创建片段失败' });
  }
});

// 片段文档路由
app.post('/api/projects/:projectId/fragments/:fragmentId/document', uploadFragmentDoc.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '没有收到文件'
    });
  }
  
  res.json({
    success: true,
    message: '文档上传成功',
    filename: req.file.filename
  });
});

app.get('/api/projects/:projectId/fragments/:fragmentId/document', async (req, res) => {
  try {
    const { projectId, fragmentId } = req.params;
    const fragmentDir = path.join(
      DATA_DIR,
      'projects',
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );
    
    const files = await fs.readdir(fragmentDir);
    const mdFile = files.find(file => file.endsWith('.md'));
    
    if (!mdFile) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    const docPath = path.join(fragmentDir, mdFile);
    const content = await fs.readFile(docPath, 'utf8');
    
    res.json({
      success: true,
      filename: mdFile,
      content
    });
  } catch (error) {
    console.error('获取文档失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文档失败'
    });
  }
});

app.post('/api/templates/:templateId/verify', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { password } = req.body;

    // 检查是否成功读取到超管密码
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      return res.json({ success: true });
    }

    // 检查模板密码
    const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`);
    const infoPath = path.join(templateDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    const templateInfo = await fs.readJson(infoPath);
    if (password === templateInfo.password) {
      res.json({ success: true });
    } else {
      res.json({ 
        success: false, 
        message: '密码错误'
      });
    }
  } catch (error) {
    console.error('验证密码失败:', error);
    res.status(500).json({
      success: false,
      message: '验证密码失败'
    });
  }
});

// 模板相关路由
app.get('/api/templates', async (req, res) => {
  try {
    const templatesDir = path.join(DATA_DIR, 'templates');
    const dirs = await fs.readdir(templatesDir);
    
    const templates = await Promise.all(
      dirs.map(async dir => {
        const infoPath = path.join(templatesDir, dir, 'info.json');
        if (await fs.pathExists(infoPath)) {
          return fs.readJson(infoPath);
        }
      })
    );

    res.json(templates.filter(Boolean));
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({ error: '获取模板列表失败' });
  }
});

app.post('/api/templates', async (req, res) => {
  const templateId = Date.now().toString(36)
  const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`)
  
  try {
    await fs.ensureDir(templateDir)
    await fs.writeJson(path.join(templateDir, 'info.json'), {
      id: templateId,
      ...req.body,
      type: req.body.type || '风型', // 确保有类型信息
      createTime: new Date().toISOString()
    })

    res.json({
      success: true,
      id: templateId
    })
  } catch (error) {
    console.error('创建模板失败:', error)
    res.status(500).json({ error: '创建模板失败' })
  }
})

// 模板文档路由
app.post('/api/templates/:templateId/document', 
  uploadTemplateDoc.single('file'), 
  (req, res) => {
    console.log('收到文档上传请求:', req.params, req.file);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有收到文件'
      });
    }

    res.json({
      success: true,
      message: '文档上传成功',
      filename: req.file.filename
    });
  }
);

app.get('/api/templates/:templateId/document', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`);
    
    const files = await fs.readdir(templateDir);
    const mdFile = files.find(file => file.endsWith('.md'));
    
    if (!mdFile) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    const docPath = path.join(templateDir, mdFile);
    const content = await fs.readFile(docPath, 'utf8');
    
    res.json({
      success: true,
      filename: mdFile,
      content
    });
  } catch (error) {
    console.error('获取文档失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文档失败'
    });
  }
});

// 模板配置文件路由
app.post('/api/templates/:templateId/config', 
  uploadTemplateConfig.single('file'), 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有收到文件'
      });
    }

    res.json({
      success: true,
      message: '配置文件上传成功',
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  }
);

// 修改配置文件下载路由
app.get('/api/templates/:templateId/config', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`);
    const infoPath = path.join(templateDir, 'info.json');
    
    let configInfo = {};
    if (fs.existsSync(infoPath)) {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      configInfo = info.configFile || {};
    }
    
    const files = await fs.readdir(templateDir);
    // 查找 .js 或 .json 文件，但排除 info.json
    const configFile = files.find(file => 
      (file.endsWith('.js') || file.endsWith('.json')) && file !== 'info.json'
    );
    
    if (!configFile) {
      return res.status(404).json({
        success: false,
        message: '配置文件不存在'
      });
    }

    const configPath = path.join(templateDir, configFile);
    const content = await fs.readFile(configPath, 'utf8');
    
    res.json({
      success: true,
      filename: configFile,
      originalName: configInfo.originalName || configFile,
      content
    });
  } catch (error) {
    console.error('获取配置文件失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置文件失败'
    });
  }
});

// 模板信息获取路由
app.get('/api/templates/:templateId/info', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`);
    const infoPath = path.join(templateDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '模板信息不存在'
      });
    }

    const info = await fs.readJson(infoPath);
    res.json(info);
  } catch (error) {
    console.error('读取模板信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板信息失败'
    });
  }
});

// 更改info.json
app.put('/api/templates/:templateId/info', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateDir = path.join(DATA_DIR, 'templates', `template-${templateId}`);
    const infoPath = path.join(templateDir, 'info.json');
    
    // 确保目录和文件存在
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '模板信息不存在'
      });
    }

    // 读取现有信息
    const currentInfo = await fs.readJson(infoPath);
    
    // 合并新的信息，保留原有的 id 和 createTime
    const updatedInfo = {
      ...currentInfo,
      ...req.body,
      id: currentInfo.id,
      createTime: currentInfo.createTime
    };

    // 写入更新后的信息
    await fs.writeJson(infoPath, updatedInfo);

    res.json({
      success: true,
      message: '模板信息更新成功'
    });
  } catch (error) {
    console.error('更新模板信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新模板信息失败'
    });
  }
});

// 获取片段信息
app.get('/api/projects/:projectId/fragments/:fragmentId/info', async (req, res) => {
  try {
    const { projectId, fragmentId } = req.params;
    const fragmentDir = path.join(
      DATA_DIR,
      'projects',
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );
    const infoPath = path.join(fragmentDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '片段信息不存在'
      });
    }

    const info = await fs.readJson(infoPath);
    res.json(info);
  } catch (error) {
    console.error('读取片段信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取片段信息失败'
    });
  }
});

// 更新片段信息
app.put('/api/projects/:projectId/fragments/:fragmentId/info', async (req, res) => {
  try {
    const { projectId, fragmentId } = req.params;
    const fragmentDir = path.join(
      DATA_DIR,
      'projects',
      `project-${projectId}`,
      'fragments',
      `fragment-${fragmentId}`
    );
    const infoPath = path.join(fragmentDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '片段信息不存在'
      });
    }

    const currentInfo = await fs.readJson(infoPath);
    const updatedInfo = {
      ...currentInfo,
      ...req.body,
      id: currentInfo.id,
      projectId: currentInfo.projectId,
      createTime: currentInfo.createTime
    };

    await fs.writeJson(infoPath, updatedInfo);
    res.json({
      success: true,
      message: '片段信息更新成功'
    });
  } catch (error) {
    console.error('更新片段信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新片段信息失败'
    });
  }
});

// server/index.js 添加新的路由

// 获取项目信息
app.get('/api/projects/:projectId/info', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(DATA_DIR, 'projects', `project-${projectId}`);
    const infoPath = path.join(projectDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '项目信息不存在'
      });
    }

    const info = await fs.readJson(infoPath);
    res.json(info);
  } catch (error) {
    console.error('读取项目信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目信息失败'
    });
  }
});

// 更新项目信息
app.put('/api/projects/:projectId/info', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(DATA_DIR, 'projects', `project-${projectId}`);
    const infoPath = path.join(projectDir, 'info.json');
    
    if (!await fs.pathExists(infoPath)) {
      return res.status(404).json({
        success: false,
        message: '项目信息不存在'
      });
    }

    const currentInfo = await fs.readJson(infoPath);
    const updatedInfo = {
      ...currentInfo,
      ...req.body,
      id: currentInfo.id,
      createTime: currentInfo.createTime
    };

    await fs.writeJson(infoPath, updatedInfo);
    res.json({
      success: true,
      message: '项目信息更新成功'
    });
  } catch (error) {
    console.error('更新项目信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新项目信息失败'
    });
  }
});

// CSV文件相关路由
app.post('/api/projects/:projectId/fragments/:fragmentId/csv/:type', 
  uploadFragmentCsv.single('file'), 
  async (req, res) => {
    try {
      const { projectId, fragmentId, type } = req.params;
      const fragmentDir = path.join(
        DATA_DIR,
        'projects',
        `project-${projectId}`,
        'fragments',
        `fragment-${fragmentId}`
      );

      // 读取片段信息
      const infoPath = path.join(fragmentDir, 'info.json');
      let info = {};
      if (await fs.pathExists(infoPath)) {
        info = await fs.readJson(infoPath);
      }

      // 获取上传的文件名
      const newFilename = req.file.filename;

      // 根据类型处理不同的配置文件
      if (type === 'wind') {
        // 删除旧的风配置文件
        if (info.windConfigFile) {
          const oldPath = path.join(CSV_DIR, 'fragment', info.windConfigFile);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            console.error('删除旧的风配置文件失败:', err);
          }
        }
        info.windConfigFile = newFilename;
      } else if (type === 'rain') {
        // 删除旧的雨配置文件
        if (info.rainConfigFile) {
          const oldPath = path.join(CSV_DIR, 'fragment', info.rainConfigFile);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            console.error('删除旧的雨配置文件失败:', err);
          }
        }
        info.rainConfigFile = newFilename;
      }

      // 保存更新后的信息到 info.json
      await fs.writeJson(infoPath, info, { spaces: 2 });

      res.json({
        success: true,
        filename: newFilename
      });
    } catch (error) {
      console.error('上传CSV文件失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '上传或更新失败'
      });
    }
});

// 下载路由
app.get('/api/projects/:projectId/fragments/:fragmentId/csv/:type/download/:filename', 
  async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(CSV_DIR, 'fragment', filename);
      
      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      res.download(filePath);
    } catch (error) {
      console.error('下载文件失败:', error);
      res.status(500).json({
        success: false,
        message: '下载失败'
      });
    }
});

// 添加测试文件上传路由
app.post('/api/test/csv/upload', uploadTestCsv.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '没有收到文件'
    });
  }
  
  res.json({
    success: true,
    filename: req.file.filename
  });
});

// 添加测试文件下载路由
app.get('/api/test/csv/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(CSV_DIR, 'test', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: '文件不存在'
    });
  }

  res.download(filePath);
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ noServer: true });
  const experimentPlayer = new ExperimentPlayer(wss);
  
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;
    const type = url.searchParams.get('type');

    switch (pathname) {
      case '/pwm':
        // 原有的 PWM 处理
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
        break;

      case '/experiment':
        // 原有的实验处理
        wss.handleUpgrade(request, socket, head, (ws) => {
          experimentPlayer.initializeExperimentClient(ws, request);
        });
        break;

      case '/mocap':
        // 新增的动捕客户端处理
        wss.handleUpgrade(request, socket, head, (ws) => {
          if (type === 'test') {
            experimentPlayer.initializeMocapTestClient(ws);
          } else {
            experimentPlayer.initializeMocapClient(ws);
          }
        });
        break;

      default:
        socket.destroy();
    }
  });

  return wss;
};

// 启动HTTP服务器
const server = app.listen(3000, '0.0.0.0', () => {
  console.log('HTTP服务器运行在端口 3000，允许外部访问');
});
const wss = initWebSocket(server);
const pwmPlayer = new PWMPlayer(wss);

// 启用硬件控制器的模拟模式
hardwareController.setSimulationMode(true);

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, server };