# 风洞实验管理系统 — 主要功能交互逻辑

---

## 一、系统通信通道

```
前端 Vue SPA
  ├── HTTP REST  →  Express Server : 3000
  └── WebSocket  ↔  WS Server : 8080  →  风洞硬件

mocap_simulator.py  →  WebSocket  →  WS Server : 8080  →  前端
```

---

## 二、主流程交互逻辑

---

### 流程 1：项目管理

**打开项目列表**
```
ProjectList
  → GET /api/projects
  → 渲染项目卡片列表
```

**新建项目**
```
NewProject 填写表单 → 保存
  → POST /api/projects  [项目元数据]
  → 跳转 ProjectList
```

**进入实验工作台**
```
点击项目卡片"进入"
  → router.push('/experiment?projectId')
  → 路由守卫更新顶部标题
  → 加载 ExperimentPage
```

---

### 流程 2：实验工作台

**加载实验主页**
```
ExperimentPage
  → 读 Vuex：实验记录列表 + 片段下拉选项
  → 渲染：左侧记录列表 | 右侧风扇矩阵 + 控制面板
```

**实验回放**
```
切换"回放" Tab → 选中记录 → 点击播放
  → WS : play / recordId
  → recordPlaybackHandler → hardwareController → 硬件
  → WS 推送：进度帧 → 进度条更新
  → WS 推送：XYZ 坐标帧 → 数据表更新
```

**片段实时运行**
```
选择片段 → 点击播放
  → WS : play / fragmentId / mode:realtime
  → experimentPlayer → pwmPlayer → hardwareController → 硬件
  → WS 推送：PWM 帧 → 风扇矩阵着色
  → WS 推送：进度帧 → 进度条更新
```

---

### 流程 3：片段管理

**打开片段列表**
```
EditFragment
  → GET /api/projects/:projectId/fragments
  → 渲染片段卡片列表
```

**新建片段**
```
NewFragment 填写表单 → 保存
  → POST /api/projects/:projectId/fragments  [片段元数据]
  → 跳转 EditFragment
```

**片段详情 — 基本 Tab**
```
修改信息 → 保存
  → PUT /api/projects/:projectId/fragments/:id
```

**片段详情 — 函数 Tab**
```
上传风片段 CSV  →  POST /api/upload/fragment/:id  [风控制序列]
上传雨雾片段 CSV  →  POST /api/upload/fragment/:id  [雨雾控制序列]

点击模拟运行 / 仿真运行
  → WS : play / fragmentId / mode
  → pwmPlayer（deal.js 解析 CSV → PWM 序列）
  → hardwareController → 硬件
  → WS 推送：PWM 帧 → 风扇矩阵着色
```

**片段详情 — 使用文档 Tab**
```
上传 .md  →  POST /api/upload/fragment/:id  [说明文档]
  → marked 渲染 Markdown 预览
```

---

### 流程 4：模板管理

**打开模板列表**
```
TemplatePage
  → GET /api/templates
  → Vuex SET_TEMPLATES
  → 按类型（风型 / 雨型 / 过渡）+ 搜索词过滤渲染
```

**切换模板类型**
```
点击分类按钮
  → Vuex SET_CURRENT_TYPE
  → getter filteredTemplates 重算 → 列表更新
```

**新建模板**
```
NewTemplate 填写表单 → 保存
  → POST /api/templates  [模板元数据]

上传 JS 配置文件  →  POST /api/upload/template/:id?templateType  [控制配置]
上传说明文档 .md  →  POST /api/upload/template/:id?templateType  [说明文档]
  → marked 渲染预览
```

---

### 流程 5：风洞测试

```
上传测试 CSV  →  POST /api/upload/test/csv  [测试控制序列]

选择运行模式 → 点击运行
  → WS : windTest / mode / fileId
  → deal.js 解析 CSV → wind-standard.js 校准 → PWM 序列
  → hardwareController → 风洞硬件
  → WS 推送：PWM 帧 → 风扇矩阵着色
  → WS 推送：进度帧 → 进度条更新
```

---

### 流程 6：动捕测试

```
mocap_simulator.py 读取模拟坐标
  → WS 推送：{ time, x, y, z }
  → motionCaptureService 解析
  → Vuex xyzData 更新

消费：
  TestMotion           → XYZ 数据表实时显示
  ExperimentSettings   → 动捕 Tab XYZ 数据表
  ThreeScene           → 三维坐标可视化
```

---

### 流程 7：实验设置

```
基本 Tab      → 编辑项目信息 → PUT /api/projects/:id
高级 Tab      → 展示协作地址 / API地址 / WS地址（只读）
动捕设置 Tab  → 实时 XYZ 数据表（来源见流程 6）
使用文档 Tab  → 上传 .md → POST /api/upload/project/:id → marked 预览
删除项目 Tab  → DELETE /api/projects/:id → 跳转 ProjectList
```

---

## 三、WebSocket 消息类型

| 方向 | type | 发送方 | 接收方 | 说明 |
|---|---|---|---|---|
| 前端 → 后端 | play | 控制面板 | experimentPlayer | 播放片段 / 记录 |
| 前端 → 后端 | pause | 控制面板 | experimentPlayer | 暂停 |
| 前端 → 后端 | stop | 控制面板 | experimentPlayer | 停止 |
| 前端 → 后端 | windTest | TestWind | windProcessRoutes | 风洞测试运行 |
| 后端 → 前端 | progress | pwmPlayer / recordPlaybackHandler | 进度条 | 播放进度 |
| 后端 → 前端 | pwmFrame | hardwareController | windTest store | PWM 矩阵帧（风扇着色） |
| 外部 → 前端 | xyzFrame | mocap_simulator.py | motionCaptureService | 动捕坐标帧 |