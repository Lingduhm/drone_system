# 无人机风洞系统技术文档

## 1. 系统架构概述

### 1.1 项目结构

drone-system/                      
├── public/                      # 公共资源目录
│   ├── terminal.html            # 独立终端页面
│   ├── favicon.ico              
│   ├── index.html               
│   └── output_coordinates_mm.json    # 模拟摄像头回传数据        
│
├── mocap_simulator/             # 公共资源目录
│   └── mocap_simulator.py       #模拟摄像头数据发送
│
├── data/                        # 数据存储根目录
│   ├── projects/                # 项目数据存储
│   │   └── project-{id}/        # 具体项目目录
│   │       ├── info.json        # 项目基本信息
│   │       ├── {name}.md        # 项目使用文档
│   │       ├── records/         # 项目实验记录
│   │       └── fragments/       # 项目的片段集合
│   │           └── fragment-{id}/ # 具体片段目录
│   │               ├── info.json  # 片段信息
│   │               └── {name}.md  # 片段使用文档
│   │
│   ├── templates/              # 模板数据存储
│   │   └── template-{id}/      # 具体模板目录
│   │       ├── info.json       # 模板基本信息
│   │       ├── {name}.md       # 模板使用文档
│   │       └── {name}.js       # JS配置文件
│   │
│   ├── csv_files/              # CSV文件统一存储
│   │   ├── test/               # 测试上传的CSV
│   │   └── fragment/           # 片段相关的CSV
│   │
│   └── settings.json           # 全局设置文件
│
├── server/                              # 后端服务器
│   ├── websocket/                       # WebSocket 处理
│   │   ├── experimentPlayer.js          # 实验播放逻辑
│   │   ├── hardwareController.js        # 硬件控制模块
│   │   ├── pwmPlayer.js                 # PWM数据播放器
│   │   └── recordPlaybackHandler.js     # 记录回放处理
│   │
│   ├── utils/                           # 工具函数
│   │   ├── deal.js                      # CSV处理和PWM生成
│   │   ├── wind-standard.js             # 标准风型矩阵函数（outside）
│   │   └── transitionLoader.js          # 过渡效果总览（outside）
│   │
│   ├── routes/                          # API路由
│   │   ├── windProcessRoutes.js         # 风处理相关
│   │   ├── projectRoutes.js             # 项目管理
│   │   ├── fragmentRoutes.js            # 片段管理
│   │   ├── recordsRoutes.js             # 记录管理
│   │   └── templateRoutes.js            # 模板管理
│   │
│   └── index.js                         # 服务器入口
│
├── src/                       # 前端源代码
│   ├── assets/                # 静态资源
│   │   ├── styles/            # 全局样式
│   │   └── UI/                # UI图标资源
│   │
│   ├── components/            # 通用组件
│   │   ├── layout/            # 布局组件
│   │   │   ├── BaseLayout.vue # 基础布局
│   │   │   ├── Header.vue     # 顶部导航
│   │   │   └── Sidebar.vue    # 侧边导航
│   │   │
│   │   └── ThreeScene.vue     # 三维模型坐标组件
│   │
│   ├── views/                 # 页面组件
│   │   ├── experiment/                # 实验相关页面
│   │   │   ├── EditFragment.vue       # 片段编辑
│   │   │   ├── ExperimentPage.vue     # 实验主页面
│   │   │   ├── ExperimentSettings.vue # 实验设置
│   │   │   ├── FragmentDetail.vue     # 片段详情
│   │   │   └── NewFragment.vue        # 新建片段
│   │   │
│   │   ├── project/            # 项目相关页面
│   │   │   ├── ProjectList.vue # 项目列表
│   │   │   └── NewProject.vue  # 新建项目
│   │   │
│   │   ├── template/              # 模板相关页面
│   │   │   ├── TemplatePage.vue   # 模板列表
│   │   │   ├── NewTemplate.vue    # 新建模板
│   │   │   └── TemplateDetail.vue # 模板详情
│   │   │
│   │   ├── test/               # 测试相关页面
│   │   │   ├── TestPage.vue    # 测试导航
│   │   │   ├── TestMotion.vue  # 动捕测试
│   │   │   ├── TestWind.vue    # 风洞测试
│   │   │   └── TestRain.vue    # 雨雾测试
│   │   │
│   │   ├── about/             # 关于页面
│   │   │   └── AboutPage.vue 
│   │   │
│   │   └── settings/             # 设置页面
│   │         └──SettingsPage.vue 
│   │
│   ├── router/             # 路由配置
│   │   └── index.js        # 路由定义
│   │
│   ├── services/               # 服务层
│   │   ├── baseService.js      # 基础服务类
│   │   ├── experimentService.js # 实验服务
│   │   ├── fileService.js      # 文件服务
│   │   ├── fragmentService.js  # 片段服务
│   │   ├── httpClient.js       # HTTP客户端
│   │   ├── motionCaptureService.js   # 动捕服务
│   │   ├── projectService.js   # 项目服务
│   │   └── templateService.js  # 模板服务
│   │
│   ├── store/                 # Vuex状态管理
│   │   ├── index.js           # Store入口
│   │   └── modules/           # 状态模块
│   │       ├── experiments.js # 实验状态
│   │       ├── fragments.js   # 片段状态
│   │       ├── navigation.js  # 导航状态
│   │       ├── projects.js    # 项目状态
│   │       ├── templates.js   # 模板状态
│   │       ├── windTest.js    # 风扇测试状态
│   │       ├── fragmentPlayback.js # 片段播放状态
│   │       └── experimentPlayback.js # 实验主页播放状态
│   │
│   ├── App.vue           # 根组件
│   └── main.js           # 应用入口
│
├── test/                       # pwm模拟测试
│   ├── mockReceiver.vue        # 模拟接收
│   └── hardwareTest.vue        # 硬件测试
│
├── package.json          # 项目配置和依赖
└── README.md             # 项目说明文档

### 1.2 核心组件
- 前端 (Vue3 + Vuex)
- 后端 (Node.js + Express)
- WebSocket服务
- 硬件控制模块


## 2. 通信接口规范

### 2.1 动作捕捉接口 (Motion Capture)

#### 2.1.1 WebSocket连接  

ws://localhost:8765

#### 2.1.2 数据格式

{
    position: [x, y, z],          // 中心位置坐标
    markers: {                    // 四个标记点坐标
      Marker1: [x, y, z],
      Marker2: [x, y, z],
      Marker3: [x, y, z],
      Marker4: [x, y, z]
  }
}

### 2.2 硬件控制接口 (PWM输出)

#### 2.2.1 UDP通信

{
  protocol: 'UDP',
  port: 8080,
  address: '127.0.0.1'  // 本地测试用，实际部署需修改
}

#### 2.2.2 数据包格式

格式: [Header(2B)][Data(18B)][Checksum(2B)]
总长度: 22字节

Header: "DT" (0x44, 0x54)
Data: 9个PWM值，每个值2字节
Checksum: 所有字节和的低16位

### 2.3 前后端通信接口

#### 2.3.1 HTTP REST API

##### 项目管理

GET    /api/projects            # 获取所有项目
POST   /api/projects            # 创建新项目
GET    /api/projects/:id        # 获取项目详情
PUT    /api/projects/:id        # 更新项目
DELETE /api/projects/:id        # 删除项目


##### 片段管理

GET    /api/projects/:pid/fragments         # 获取项目片段
POST   /api/projects/:pid/fragments         # 创建新片段
GET    /api/projects/:pid/fragments/:fid    # 获取片段详情
PUT    /api/projects/:pid/fragments/:fid    # 更新片段
DELETE /api/projects/:pid/fragments/:fid    # 删除片段


#### 2.3.2 WebSocket实验接口

##### 连接

ws://localhost:3000/experiment
ws://localhost:3000/pwm

##### 命令类型
javascript
{
  START: '开始播放',
  PAUSE: '暂停',
  RESUME: '恢复',
  STOP: '停止',
  SEEK: '跳转到指定帧',
  SET_TERMINAL: '设置终端状态',
  SET_RUN_MODE: '设置运行模式'
}


## 3. 数据格式规范

### 3.1 CSV文件格式
csv
wind(ID),{template_id}
timeline,centerX,centerY,width,height,value1,easing1,value2,easing2,...


## 4. 部署说明

### 4.1 环境要求
- Node.js >= 14.0.0
- Python >= 3.8.0 (用于动捕模拟器)
- 操作系统: Windows

### 4.2 启动服务

# 启动动作捕捉模拟器
cd drone-system/mocap_simulator
python mocap_simulator.py

# 启动后端服务
node server/index.js

# 启动前端开发服务器
npm run serve

# 启动pwm模拟接收器
node test/mockReceiver.js


## 5. 开发指南

### 5.1 扩展硬件支持（pwm）
1. 修改 `hardwareController.js` 中的通信协议
2. 更新数据包格式
3. 实现新的硬件驱动接口

### 5.2 自定义动作捕捉数据源
1. 实现WebSocket服务器
2. 按照规定格式发送坐标数据
3. 在 `motionCaptureService.js` 以及 `experimentPlayer.js` 中更新连接配置
const mocapWs = new WebSocket('ws://localhost:8765');

