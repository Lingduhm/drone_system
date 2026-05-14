<template>
  <div class="settings-page">
    <!-- 顶部标签栏 -->
    <div class="template-header">
      <div class="experiment-tabs">
        <div
          v-for="tab in settingTabs"
          :key="tab"
          :class="['tab', { active: currentTab === tab }]"
          @click="switchTab(tab)"
        >
          {{ tab }}
        </div>
      </div>
    </div>

    <!-- 基本页面 -->
    <template v-if="currentTab === '基本'">
  <!-- 操作按钮 -->
  <div class="action-buttons-form">
    <button class="btn btn-save" @click="handleSave">
      <img src="@/assets/UI/保存白色.svg" alt="保存">
      <span>保存</span>
    </button>
    <button class="btn btn-cancel" @click="handleCancel">
      <img src="@/assets/UI/删除白色.svg" alt="取消">
      <span>取消</span>
    </button>
  </div>

      <!-- 表单内容 -->
      <div class="info-container">
        <div class="form-group">
          <label>项目名称</label>
          <input 
            type="text" 
            v-model="formData.title"
            placeholder="基于PX4系统的人工智能增强学习无人机稳定系统研究"
          >
        </div>

        <div class="form-group">
          <label>负责人</label>
          <input 
            type="text" 
            v-model="formData.creator"
            placeholder="张三"
          >
        </div>

        <div class="form-group">
          <label>密码 <span class="password-hint">仅支持数字</span></label>
          <input 
            type="password" 
            v-model="formData.password"
            placeholder="123456789"
          >
        </div>

        <div class="form-group">
          <label>联系电话</label>
          <input 
            type="tel" 
            v-model="formData.contact"
            placeholder="18088888888"
          >
        </div>

        <div class="form-group">
          <label>项目简介</label>
          <textarea 
            v-model="formData.description"
            placeholder="请输入项目简介..."
          ></textarea>
        </div>
      </div>
    </template>

    <!-- 高级页面 -->
    <template v-if="currentTab === '高级'">
      <div class="advanced-settings">
        <div class="api-address">
          <h3>项目协作地址</h3>
          <div class="address-input">http://192.168.1.30/a3b9c4</div>
        </div>

        <div class="api-address">
          <h3>项目API控制地址</h3>
          <div class="address-input">http://192.168.1.30/api/a3b9c4</div>
        </div>

        <div class="api-address">
          <h3>项目websocket回传地址</h3>
          <div class="address-input">ws://192.168.1.30/ws/a3b9c4</div>
        </div>
      </div>
    </template>

    <!-- 动捕设置页面 - 更新部分 -->
    <template v-if="currentTab === '动捕设置'">
      <div class="mocap-settings">
        <!-- 三维显示容器 -->
        <div class="containers-row">
          <div class="empty-container">
            <ThreeScene />
          </div>
        </div>

        <!-- 数据表格行 -->
        <div class="containers-row">
          <div class="table-container">
            <table class="xyz-table">
              <thead>
                <tr>
                  <th>时间 (s)</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Z</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in displayRecords" :key="record.frameIndex">
                  <td>{{ record.time }}</td>
                  <td>{{ record.x }}</td>
                  <td>{{ record.y }}</td>
                  <td>{{ record.z }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 控制按钮行 -->
        <div class="containers-row">
          <div class="control-container">
            <div class="playback-buttons">
              <button class="control-btn" @click="togglePlayback">
                <div v-if="isPaused || !isPlaying" class="play-icon"></div>
                <div v-else class="pause-icon">
                  <div class="pause-line"></div>
                  <div class="pause-line"></div>
                </div>
              </button>
              <button class="control-btn" @click="stop">
                <div class="stop-icon"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 使用文档页面 -->
    <template v-if="currentTab === '使用文档'">
    <div class="doc-container">
      <div class="action-buttons">
        <button class="btn btn-blue" @click="handleDocUpload">
          <img src="@/assets/UI/上传白色.svg" alt="上传">
          <span>{{ documentContent ? '重新上传' : '上传' }}配置文件</span>
        </button>
        <button 
          class="btn btn-blue" 
          @click="handleDocDownload"
          :disabled="!documentContent"
        >
          <img src="@/assets/UI/下载白色.svg" alt="下载">
          <span>下载配置文件</span>
        </button>
      </div>


      <!-- 文件显示区域 -->
      <div v-if="uploadedDoc" class="file-display">
        <img src="@/assets/UI/文件蓝色.svg" class="file-icon">
        <span class="file-name">{{ uploadedDoc.name }}</span>
        <img src="@/assets/UI/确认蓝色.svg" class="check-icon">
      </div>

      <!-- Markdown预览容器 -->
      <div class="markdown-preview" v-if="documentContent">
        <div class="markdown-content" v-html="parsedContent"></div>
      </div>
    </div>
  </template>

    <!-- 删除项目页面 -->
    <template v-if="currentTab === '删除项目'">
      <div class="delete-container">
        <button class="btn btn-danger" @click="handleDelete">
          <img src="@/assets/UI/删除.svg" alt="删除">
          <span>删除项目</span>
        </button>
        <p class="delete-warning">项目一旦删除，不可恢复！如非项目开发者本人，请致电咨询。</p>
      </div>
    </template>

  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import projectService from '@/services/projectService'
import ThreeScene from '@/components/ThreeScene.vue'

const MAX_FRAMES = 200 // 最大帧数
const FRAME_INTERVAL = 0.01 // 帧间隔（秒）

export default {
  name: 'ExperimentSettings',

  components: {
    ThreeScene
  },
  
  setup() {
    const route = useRoute()
    const currentTab = ref('基本')
    const settingTabs = ['基本', '高级', '动捕设置', '使用文档', '删除项目']
    const uploadedDoc = ref(null)
    const documentContent = ref(null)
    const xyzRecords = ref([]);  // 保留原有的xyz数据
    const router = useRouter(); // 获取 router 实例

    // 动捕相关状态
    const isPlaying = ref(false)
    const isPaused = ref(false)
    const records = ref([])
    const ws = ref(null)
    let startTime = null
    let frameCount = 0
    let animationFrameId = null
    let lastPosition = [0, 0, 0]
    let lastMarkers = {
      Marker1: [0, 0, 0],
      Marker2: [0, 0, 0],
      Marker3: [0, 0, 0],
      Marker4: [0, 0, 0]
    }
    
    // 获取项目ID
    const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
    
    // 表单数据
    const formData = ref({
      title: '',
      creator: '',
      password: '',
      contact: '',
      description: ''
    });

        // 计算要显示的记录
        const displayRecords = computed(() => {
      return records.value.slice().sort((a, b) => b.frameIndex - a.frameIndex)
    })

    // 格式化时间
    const formatTime = (frameIndex) => {
      const totalSeconds = frameIndex * FRAME_INTERVAL
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = Math.floor(totalSeconds % 60)
      const milliseconds = Math.floor((totalSeconds * 100) % 100)
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`
    }

    // 更新动画帧
    const updateFrame = () => {
      if (!isPlaying.value || isPaused.value || !startTime) {
        return
      }

      const currentTime = Date.now()
      const elapsedTime = currentTime - startTime
      const expectedFrames = Math.floor(elapsedTime / 10)

      if (expectedFrames > frameCount) {
        const newRecord = {
          frameIndex: frameCount,
          time: formatTime(frameCount),
          x: lastPosition[0].toFixed(2),
          y: lastPosition[1].toFixed(2),
          z: lastPosition[2].toFixed(2)
        }

        records.value.unshift(newRecord)
        if (records.value.length > MAX_FRAMES) {
          records.value = records.value.slice(0, MAX_FRAMES)
        }

        window.dispatchEvent(new CustomEvent('coordinate-update', {
          detail: {
            coordinates: {
              position: lastPosition,
              markers: lastMarkers
            },
            time: newRecord.time
          }
        }))

        frameCount++
      }

      animationFrameId = requestAnimationFrame(updateFrame)
    }

    // 动捕控制函数
    const startAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      startTime = Date.now()
      frameCount = 0
      animationFrameId = requestAnimationFrame(updateFrame)
    }

    const stopAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    const handleMocapData = (message) => {
  // 更新最新的坐标
  lastPosition = message.data.position;
  
  // 处理markers数据，兼容新旧两种格式
  if (message.data.markers) {
    lastMarkers = message.data.markers;
  } else {
    // 兼容旧格式
    lastMarkers = {
      Marker1: message.data.Marker1 || [0, 0, 0],
      Marker2: message.data.Marker2 || [0, 0, 0],
      Marker3: message.data.Marker3 || [0, 0, 0],
      Marker4: message.data.Marker4 || [0, 0, 0]
    };
  }
};

const connectWebSocket = () => {
  if (ws.value) {
    ws.value.close();
  }

  // 明确指定这是mocap测试连接
  ws.value = new WebSocket(`ws://${window.location.hostname}:3000/mocap?type=test`);
  
  ws.value.onopen = () => {
    console.log('Connected to mocap WebSocket');
  };

  ws.value.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      switch(message.type) {
        case 'MOCAP_DATA':
          if (isPlaying.value && !isPaused.value) {
            handleMocapData(message)
          }
          break;

        case 'ERROR':
          console.error('收到错误消息:', message.message)
          alert(message.message)
          isPlaying.value = false
          isPaused.value = false
          stopAnimation()
          break;
      }
    } catch (error) {
      console.error('处理WebSocket消息时出错:', error)
    }
  };

      ws.value.onerror = (error) => {
        console.error('WebSocket error occurred:', error)
        if (isPlaying.value) {
          alert('未能连接到动捕系统')
          isPlaying.value = false
          isPaused.value = false
          stopAnimation()
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket connection closed')
        isPlaying.value = false
        isPaused.value = false
        stopAnimation()
      }
    }

    const togglePlayback = () => {
      if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
        connectWebSocket()
      }

      if (!isPlaying.value) {
        isPlaying.value = true
        isPaused.value = false
        records.value = []
        lastPosition = [0, 0, 0]
        startAnimation()
        ws.value.send(JSON.stringify({ type: 'START' }))
      } else if (isPaused.value) {
        isPaused.value = false
        startTime = Date.now() - (frameCount * 10)
        animationFrameId = requestAnimationFrame(updateFrame)
        ws.value.send(JSON.stringify({ type: 'RESUME' }))
      } else {
        isPaused.value = true
        stopAnimation()
        ws.value.send(JSON.stringify({ type: 'PAUSE' }))
      }
    }

    const stop = () => {
      if (ws.value) {
        ws.value.send(JSON.stringify({ type: 'STOP' }))
      }
      isPlaying.value = false
      isPaused.value = false
      stopAnimation()
      startTime = null
      frameCount = 0
      records.value = []
      lastPosition = [0, 0, 0]
      lastMarkers = {
        Marker1: [0, 0, 0],
        Marker2: [0, 0, 0],
        Marker3: [0, 0, 0],
        Marker4: [0, 0, 0]
      }

      window.dispatchEvent(new CustomEvent('coordinate-update', {
        detail: {
          coordinates: {
            position: [0, 0, 0],
            markers: {
              Marker1: [0, 0, 0],
              Marker2: [0, 0, 0],
              Marker3: [0, 0, 0],
              Marker4: [0, 0, 0]
            }
          },
          time: "00:00.00"
        }
      }))
    }

    // 加载项目信息
    const loadProjectInfo = async () => {
      if (!projectId) {
        console.error('未找到项目ID');
        return;
      }

      try {
        const info = await projectService.getProjectInfo(projectId);
        if (info) {
          formData.value = {
            title: info.title || '',
            creator: info.creator || '',
            password: info.password || '',
            contact: info.contact || '',
            description: info.description || ''
          };
        }
      } catch (error) {
        console.error('获取项目信息失败:', error);
      }
    };

    // 定义获取文档的方法
    const handleGetDocument = async () => {
      const projectId = route.query.projectId || localStorage.getItem('currentProjectId')
      if (projectId) {
        try {
          const doc = await projectService.getProjectDocument(projectId)
          if (doc) {
            documentContent.value = doc.content
            uploadedDoc.value = { name: doc.filename }
          }
        } catch (error) {
          console.error('获取文档失败:', error)
        }
      }
    }

    // 文档上传处理
    const handleDocUpload = async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          const projectId = route.query.projectId || localStorage.getItem('currentProjectId')
          if (!projectId) {
            alert('未找到项目ID')
            return
          }

          try {
            console.log('Uploading file:', file)
            uploadedDoc.value = file

            const reader = new FileReader()
            reader.onload = async (event) => {
              try {
                // 先上传到服务器
                await projectService.uploadProjectDocument(projectId, file)
                // 上传成功后更新显示
                documentContent.value = event.target.result
              } catch (error) {
                console.error('文档上传失败:', error)
                alert('文档上传失败，请重试')
                // 重置状态
                uploadedDoc.value = null
                documentContent.value = null
              }
            }
            reader.readAsText(file)
          } catch (error) {
            console.error('文件读取失败:', error)
            alert('文件读取失败，请重试')
          }
        }
      }
      input.click()
    }

    // 文档下载处理
    const handleDocDownload = async () => {
      try {
        const projectId = route.query.projectId || localStorage.getItem('currentProjectId')
        if (!projectId) {
          alert('未找到项目ID')
          return
        }

        await projectService.downloadProjectDocument(projectId)
      } catch (error) {
        console.error('下载文档失败:', error)
        alert('下载失败，请重试')
      }
    }

    // 基本信息保存
    const handleSave = async () => {
      if (!formData.value.title || !formData.value.creator) {
        alert('请填写必要信息');
        return;
      }

      try {
        await projectService.updateProjectInfo(projectId, formData.value);
        alert('保存成功');
      } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试');
      }
    }

    // 取消修改
    const handleCancel = () => {
      loadProjectInfo(); // 重新加载数据，恢复原始状态
    }

    // 删除项目
    const handleDelete = async () => {
  if (confirm('确定要删除该项目吗？此操作不可恢复！')) {
    try {
      // 确保获取到正确的projectId
      const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
      if (!projectId) {
        alert('未找到项目ID');
        return;
      }
      
      await projectService.deleteProject(projectId);
      // 删除成功后跳转到项目列表页面
      router.push('/project');
    } catch (error) {
      console.error('删除项目失败:', error);
      alert('删除失败，请重试');
    }
  }
};

    // 切换标签页
    const switchTab = (tab) => {
  currentTab.value = tab;
  
  // 根据不同标签页执行对应功能
  if (tab === '使用文档') {
    handleGetDocument();
  } else if (tab === '动捕设置') {
    connectWebSocket();
  } else if (ws.value) {
    // 如果切换到其他标签页，关闭WebSocket连接
    ws.value.close();
    ws.value = null;
  }
};

    // Markdown内容解析
    const parsedContent = computed(() => {
      return documentContent.value ? marked(documentContent.value) : ''
    })

// 组件挂载时初始化数据
onMounted(async () => {
  await loadProjectInfo();
  
  // 根据当前标签页初始化对应功能
  if (currentTab.value === '使用文档') {
    await handleGetDocument();
  } else if (currentTab.value === '动捕设置') {
    connectWebSocket();
  }
});

onUnmounted(() => {
  // 停止动画
  stopAnimation();
  
  // 关闭WebSocket连接
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
});

    return {
      currentTab,
      settingTabs,
      uploadedDoc,
      documentContent,
      parsedContent,
      formData,
      xyzRecords,  // 保留原有的数据
      handleDocUpload,
      handleSave,
      handleCancel,
      handleDelete,
      switchTab,
      handleDocDownload,
      isPlaying,
      isPaused,
      displayRecords,
      togglePlayback,
      stop
    }
  }
}
</script>

<style lang="scss" scoped>
// 从你提供的TemplateDetail.vue中复制相关样式并修改

/* 基础样式 */
.settings-page {
  padding: 1vw;
}

/* 标签页样式 */
.template-header {
  margin: -2vw -2vw 1vw -2.6vw;
  padding: 1vw 2vw;
  background-color: rgb(242, 242, 242);
}

.experiment-tabs {
  display: flex;
  gap: 3vw;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: -1vw;
  padding-bottom: 0.5vw;
}

.tab {
  font-size: 0.85vw;
  color: #000;
  cursor: pointer;
  font-weight: bold;
  padding: 0.3vw 0;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    color: #00A0E9;
    transform: scale(1.05);
  }

  &::before {
    content: '';
    position: absolute;
    bottom: -0.6vw;
    left: 50%;
    width: 100%;
    height: 2.5px;
    background-color: #00A0E9;
    transition: all 0.3s ease;
    transform: translateX(-50%);
    opacity: 0;
  }

  &:hover::before {
    width: 100%;
    opacity: 1;
  }

  &.active {
    color: #00A0E9;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -0.6vw;
      left: 50%;
      width: 100%;
      height: 2.5px;
      background-color: #00A0E9;
      transform: translateX(-50%);
      opacity: 1;
    }
  }
}

/* 基本页面样式 */
.info-container {
  width: 32vw;
  background-color: white;
  padding: 1.3vw;
  border-radius: 0.5vw;
  margin-left: -1vw;
  margin-top: -0.5vw;
  margin-bottom: -1vw;
}

.form-group {
  margin-bottom: 1vw;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 0.5vw;
    font-size: 1vw;
  }

  .password-hint {
    color: #999;
    font-size: 0.8vw;
    margin-left: 0.5vw;
  }

  input, textarea {
    width: 100%;
    padding: 0.8vw;
    border: 1px solid #e8e8e8;
    border-radius: 0.3vw;
    font-size: 0.9vw;
    
    &:focus {
      outline: none;
      border-color: #00A0E9;
    }
  }

  textarea {
    height: 10vw;
    resize: none;
  }
}

.action-buttons-form {
  display: flex;
  gap: 1vw;
  margin: 0vw -1vw 1.5vw;
  
  .btn {
    width: 15.5vw;
    padding: 0.7vw 1vw;
    border: none;
    border-radius: 0.3vw;
    cursor: pointer;
    display: flex;
    justify-content: left;
    transition: transform 0.3s;

    &.btn-save {
      background-color: #00A0E9;
    }

    &.btn-cancel {
      background-color: #e40041;
    }
  }
}

/* 高级页面样式 */
.advanced-settings {
  margin: -1vw -2vw;
  padding: 1vw 2vw;

  .api-address {
    margin-bottom: 2vw;

    h3 {
      font-size: 1vw;
      color: #333;
      margin-bottom: 0.5vw;
    }

    .address-input {
      width: 32vw;
      padding: 0.8vw 1vw;
      background: transparent;
      border-top: 1px solid rgb(232, 232, 232);
      border-bottom: 1px solid rgb(232, 232, 232);
      border-left: none;
      border-right: none;
      font-size: 0.9vw;
      color: #666;
    }
  }
}

/* 动捕设置样式 */
.mocap-settings {
  display: flex;
  flex-direction: column;
  width: 30vw;
  margin: -0.5vw -1vw;

  .empty-container {
    background-color: rgb(232, 232, 232);
    padding: 1vw;
    border-radius: 0.5vw;
    aspect-ratio: 1;
    width: 100%;
    margin-bottom: 0.5vw;
    width: 30vw;
  }

  .table-container {
    background: white;
    border-radius: 0.5vw;
    height: 20vh;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #00A0E9;
      border-radius: 3px;
    }
  }

  .xyz-table {
    width: 100%;
    border-collapse: collapse;

    th {
      position: sticky;
      top: 0;
      background: #f5f5f5;
      padding: 0.8vw;
      font-size: 0.9vw;
      color: #333;
      text-align: center;
      border-bottom: 2px solid #e0e0e0;
    }

    td {
      padding: 0.6vw 0.8vw;
      font-size: 0.85vw;
      color: #666;
      border-bottom: 1px solid #f0f0f0;
      text-align: center;
    }

    tr:last-child td {
      border-bottom: none;
    }

    td:first-child {
      color: #00A0E9;
      font-weight: 500;
    }
  }
}

/* 使用文档样式 */
.doc-container {
  margin: -1.5vw -3vw;
  padding: 1vw 2vw;

  .action-buttons {
    display: flex;
    gap: 1vw;
    margin: 1vw 0;
  }
}

.btn {
  width: 15.5vw;
  padding: 0.7vw 1vw;
  border: none;
  border-radius: 0.3vw;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: white;
  transition: transform 0.3s;
  margin-top: -0.5vw;

  &.btn-blue {
    background-color: #00A0E9;
  }

  &.btn-danger {
    width: 18vw;
    background-color: #e40041;
  }

  img {
    width: 1.2vw;
    height: 1.2vw;
    margin-right: 1vw;
  }

  span {
    font-size: 0.9vw;
  }

  &:hover {
    transform: scale(1.02);
  }
}

.file-display {
  background: transparent;
  border-radius: 0.3vw;
  padding: 0.8vw;
  display: flex;
  align-items: center;
  margin: 1vw 0;
  width: 32vw;
  border-top: 2px solid rgb(232, 232, 232);
  border-bottom: 2px solid rgb(232, 232, 232);

  .file-icon {
    width: 1.2vw;
    height: 1.2vw;
    margin-right: 1vw;
  }

  .file-name {
    flex: 1;
    font-size: 0.9vw;
    color: #333;
  }

  .check-icon {
    width: 1vw;
    height: 1vw;
  }
}

.markdown-preview {
  width: 32vw;
  height: calc(100vh - 18vw);
  background: white;
  border-radius: 0.5vw;
  margin-top: 1vw;
  margin-left: 0vw;
  overflow: hidden;

  .markdown-content {
    height: 100%;
    padding: 1vw;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #00A0E9;
      border-radius: 3px;
    }
  }
}

/* 删除页面样式 */
.delete-container {
  margin: -0.5vw -3vw;
  padding: 1vw 2vw;

  .btn-danger {
    margin-bottom: 1vw;
    
    &:hover {
      background-color: darken(#e40041, 10%);
    }
  }

  .delete-warning {
    color: #e40041;
    font-size: 0.8vw;
    margin-left: 0vw;
  }
}

/* 动捕设置相关样式 */
.mocap-settings {
  display: flex;
  flex-direction: column;
  width: 30vw;
  margin: -0.5vw -1vw;
  gap: 1vw;
}

.containers-row {
  display: flex;
  gap: 1vw;
}

.empty-container {
  flex: 1;
  background-color: white;
  padding: 1vw;
  border-radius: 0.5vw;
  aspect-ratio: 1;
  width: 100%;
  overflow: hidden;
}

.table-container {
  width: 100%;
  background: white;
  border-radius: 0.5vw;
  height: 28vh;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #00A0E9;
    border-radius: 3px;
  }
}

.xyz-table {
  width: 100%;
  border-collapse: collapse;

  th {
    position: sticky;
    top: 0;
    background: #f5f5f5;
    padding: 0.8vw;
    font-size: 0.9vw;
    color: #333;
    text-align: center;
    border-bottom: 2px solid #e0e0e0;
  }

  td {
    padding: 0.6vw 0.8vw;
    font-size: 0.85vw;
    color: #666;
    border-bottom: 1px solid #f0f0f0;
    text-align: center;
  }

  tr:last-child td {
    border-bottom: none;
  }

  td:first-child {
    color: #00A0E9;
    font-weight: 500;
  }
}

.control-container {
  width: 100%;
  background: rgb(242, 242, 242);
  border-radius: 0.5vw;
  padding: 1vw;
  display: flex;
  justify-content: center;
}

.playback-buttons {
  display: flex;
  gap: 1vw;
}

.control-btn {
  width: 2.5vw;
  height: 2.5vw;
  border-radius: 50%;
  background-color: #00A0E9;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.1);
  }
}

.pause-icon {
  display: flex;
  gap: 0.3vw;
}

.pause-line {
  width: 0.3vw;
  height: 1.2vw;
  background-color: white;
  border-radius: 0.15vw;
}

.play-icon {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0.7vw 0 0.7vw 1.2vw;
  border-color: transparent transparent transparent white;
  margin-left: 0.2vw;
}

.stop-icon {
  width: 1vw;
  height: 1vw;
  background-color: white;
  border-radius: 0.1vw;
}
</style>