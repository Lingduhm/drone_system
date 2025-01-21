const express = require('express');
const WebSocket = require('ws');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();

// 基础路径定义和目录初始化
const DATA_DIR = path.join(__dirname, '../data');
const CSV_DIR = path.join(DATA_DIR, 'csv_files');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

// 确保目录结构存在
[
  path.join(DATA_DIR, 'projects'),
  path.join(DATA_DIR, 'templates'),
  path.join(DATA_DIR, 'templates', '风型'),
  path.join(DATA_DIR, 'templates', '雨型'),
  path.join(DATA_DIR, 'templates', '过渡'),
  path.join(CSV_DIR, 'test'),
  path.join(CSV_DIR, 'fragment')
].forEach(dir => fs.ensureDirSync(dir));

// 确保 settings.json 存在
if (!fs.existsSync(SETTINGS_PATH)) {
  fs.writeJsonSync(SETTINGS_PATH, {
    created: new Date().toISOString()
  });
}

// 文件存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { type, id } = req.params;
    const fileType = req.body.fileType;
    let uploadPath;
    
    if (type === 'template') {
      const templateType = req.query.templateType || '风型';
      uploadPath = path.join(DATA_DIR, 'templates', templateType, `template-${id}`);
    } else {
      uploadPath = path.join(DATA_DIR, type === 'project' ? 'projects' : 'fragments', `${type}-${id}`);
    }
    
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileType = req.body.fileType;
    if (fileType === 'document') {
      cb(null, 'document.md');
    } else if (fileType === 'config') {
      cb(null, file.originalname.endsWith('.js') ? 'config.js' : 'config.json');
    } else {
      cb(null, file.originalname);
    }
  }
});

const upload = multer({ storage });

// 中间件
app.use(cors());
app.use(express.json());

// 项目相关路由
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

    const validProjects = projects.filter(Boolean);
    res.json(validProjects);
  } catch (error) {
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

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
    res.status(500).json({ error: '创建项目失败' });
  }
});

// 片段相关路由
app.get('/api/projects/:projectId/fragments', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const fragmentsDir = path.join(DATA_DIR, 'projects', `project-${projectId}`, 'fragments');
    
    if (!await fs.pathExists(fragmentsDir)) {
      await fs.ensureDir(fragmentsDir);
      return res.json([]);
    }

    const fragmentFolders = await fs.readdir(fragmentsDir);
    
    if (fragmentFolders.length === 0) {
      return res.json([]);
    }

    const fragments = await Promise.all(
      fragmentFolders.map(async folder => {
        const infoPath = path.join(fragmentsDir, folder, 'info.json');
        try {
          if (await fs.pathExists(infoPath)) {
            const data = await fs.readJson(infoPath);
            return data;
          }
        } catch (err) {
          return null;
        }
      })
    );

    res.json(fragments.filter(Boolean));
    
  } catch (error) {
    res.status(500).json([]);
  }
});

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
    await fs.ensureDir(path.join(DATA_DIR, 'projects', `project-${projectId}`, 'fragments'));
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
    res.status(500).json({ error: '创建片段失败' });
  }
});

// 模板相关路由
app.get('/api/templates', async (req, res) => {
  try {
    const templatesDir = path.join(DATA_DIR, 'templates');
    const types = ['风型', '雨型', '过渡'];
    let allTemplates = [];

    // 遍历所有类型目录
    for (const type of types) {
      const typeDir = path.join(templatesDir, type);
      if (await fs.pathExists(typeDir)) {
        const dirs = await fs.readdir(typeDir);
        const templates = await Promise.all(
          dirs.map(async dir => {
            const infoPath = path.join(typeDir, dir, 'info.json');
            if (await fs.pathExists(infoPath)) {
              const data = await fs.readJson(infoPath);
              return { ...data, type }; // 添加类型信息
            }
            return null;
          })
        );
        allTemplates = [...allTemplates, ...templates.filter(Boolean)];
      }
    }

    res.json(allTemplates);
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({ error: '获取模板列表失败' });
  }
});

app.post('/api/templates', async (req, res) => {
  const templateId = Date.now().toString(36);
  const templateType = req.body.type || '风型';  // 从请求体获取类型
  const templateDir = path.join(DATA_DIR, 'templates', templateType, `template-${templateId}`);
  
  try {
    await fs.ensureDir(templateDir);
    await fs.writeJson(path.join(templateDir, 'info.json'), {
      id: templateId,
      ...req.body,
      createTime: new Date().toISOString()
    });

    res.json({
      success: true,
      id: templateId
    });
  } catch (error) {
    res.status(500).json({ error: '创建模板失败' });
  }
});

// 配置文件存储配置
const configStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { type, id } = req.params;
    let uploadPath;
    
    if (type === 'template') {
      const templateType = req.query.templateType || '风型';
      uploadPath = path.join(DATA_DIR, 'templates', templateType, `template-${id}`);
    } else if (type === 'project') {
      uploadPath = path.join(DATA_DIR, 'projects', `project-${id}`);
    } else if (type === 'fragment') {
      const projectId = req.query.projectId;
      uploadPath = path.join(DATA_DIR, 'projects', `project-${projectId}`, 'fragments', `fragment-${id}`);
    } else {
      uploadPath = DATA_DIR;
    }
    
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    if (file.originalname.endsWith('.js')) {
      cb(null, 'config.js');
    } else if (file.originalname.endsWith('.json')) {
      cb(null, 'config.json');
    } else if (file.originalname.endsWith('.md')) {
      cb(null, 'document.md');
    } else {
      cb(null, file.originalname);
    }
  }
});

const uploadConfig = multer({ storage: configStorage });

// 统一的文件上传路由
app.post('/api/upload/:type/:id', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有收到文件' });
  }

  res.json({
    success: true,
    path: req.file.path,
    filename: req.file.filename
  });
});

// 文件列表路由
app.get('/api/files/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const dirPath = path.join(CSV_DIR, type);
    const files = await fs.readdir(dirPath);
    
    const fileList = await Promise.all(files.map(async file => {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      return {
        id: file,
        name: file.substring(file.indexOf('-') + 1),
        created: stats.ctime,
        size: stats.size
      };
    }));

    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

// WebSocket服务器设置
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('收到消息:', message);
  });
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`HTTP服务器运行在端口 ${PORT}`);
  console.log(`WebSocket服务器运行在端口 8080`);
  console.log(`数据目录: ${DATA_DIR}`);
});