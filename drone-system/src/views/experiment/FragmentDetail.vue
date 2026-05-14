<template>
  <div class="fragment-detail">
    <!-- 顶部标签栏 -->
    <div class="template-header">
      <div class="experiment-tabs">
        <div
          v-for="tab in fragmentTabs"
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
      <div class="info-container" v-if="fragmentData"> <!-- 添加 v-if 保护 -->
        <div class="form-group">
          <label>片段名称</label>
          <input 
            type="text" 
            v-model="fragmentData.title"
            placeholder="可变截面、强度标准湍流"
          >
        </div>

        <div class="form-group">
          <label>负责人</label>
          <input 
            type="text" 
            v-model="fragmentData.creator"
            placeholder="张三"
          >
        </div>

        <div class="form-group">
          <label>密码 <span class="password-hint">仅支持数字</span></label>
          <input 
            type="password" 
            v-model="fragmentData.password"
            placeholder="123456789"
          >
        </div>

        <div class="form-group">
          <label>联系电话</label>
          <input 
            type="tel" 
            v-model="fragmentData.contact"
            placeholder="18088888888"
          >
        </div>

        <div class="form-group">
          <label>片段简介</label>
          <textarea 
            v-model="fragmentData.description"
            placeholder="请输入片段简介..."
          ></textarea>
        </div>
      </div>
    </template>

    <!-- 函数页面 -->
    <template v-if="currentTab === '函数'">
  <div class="function-container">
    <div class="left-content">
      <!-- 风片段文件操作 -->
      <div class="action-buttons-row">
        <button class="btn btn-blue" @click="handleWindUpload">
          <img src="@/assets/UI/上传白色.svg" alt="上传">
          <span>上传风片段配置文件</span>
        </button>
        <button 
    class="btn btn-blue" 
    @click="handleWindDownload"
    :disabled="!uploadedWindFile"
  >
          <img src="@/assets/UI/下载白色.svg" alt="下载">
          <span>下载风片段配置文件</span>
        </button>
      </div>

      <!-- 风片段文件显示 -->
      <div v-if="uploadedWindFile" class="file-display">
        <img src="@/assets/UI/文件蓝色.svg" class="file-icon">
        <span class="file-name">{{ uploadedWindFile.name }}</span>
        <img src="@/assets/UI/确认蓝色.svg" class="check-icon">
      </div>

      <!-- 雨雾片段文件操作 -->
      <div class="action-buttons-row">
        <button class="btn btn-blue" @click="handleRainUpload">
          <img src="@/assets/UI/上传白色.svg" alt="上传">
          <span>上传雨雾片段配置文件</span>
        </button>
        <button 
    class="btn btn-blue" 
    @click="handleRainDownload"
    :disabled="!uploadedRainFile"
  >
          <img src="@/assets/UI/下载白色.svg" alt="下载">
          <span>下载雨雾片段配置文件</span>
        </button>
      </div>

      <!-- 雨雾片段文件显示 -->
      <div v-if="uploadedRainFile" class="file-display">
        <img src="@/assets/UI/文件蓝色.svg" class="file-icon">
        <span class="file-name">{{ uploadedRainFile.name }}</span>
        <img src="@/assets/UI/确认蓝色.svg" class="check-icon">
      </div>

      <!-- 运行按钮 -->
      <div class="run-buttons">
        <button 
          :class="['run-button', { active: runMode === 'simulate' }]"
          @click="setRunMode('simulate')"
        >
          模拟运行
        </button>
        <button 
          :class="['run-button', { active: runMode === 'real' }]"
          @click="setRunMode('real')"
        >
          仿真运行
        </button>
      </div>
      
      <!-- 模拟运行提示 -->
      <div v-if="runMode === 'simulate'" class="simulate-hint">
        模拟运行不包括雨雾片段。
      </div>
    </div>

    <!-- 右侧内容 -->
    <div v-show="runMode" class="right-content">
      <!-- 风扇网格容器 -->
      <div class="fan-grid-container">
        <div class="fan-grid">
  <div 
    v-for="group in 144" 
    :key="'group-' + group"
    class="fan-group"
  >
    <div 
      v-for="fan in 9" 
      :key="'fan-' + group + '-' + fan"
      class="fan"
      :style="getFanStyle(group - 1, fan - 1)"
    ></div>
  </div>
</div>
      </div>

      <!-- 渐变条 -->
      <div class="gradient-bar">
        <div class="color-gradient">
          <div v-for="n in 10" :key="n" class="gradient-segment"></div>
        </div>
        <div class="gradient-labels">
          <span v-for="n in 10" :key="n">{{ n * 10 }}</span>
        </div>
      </div>

      <!-- 进度条和控制按钮 -->
      <div class="control-panel">
        <div class="progress-bar"
        @click="handleProgressClick">
  <div 
    class="progress" 
    :style="{ width: `${playbackProgress}%` }"
  ></div>
  <div 
    class="progress-handle" 
    :style="{ left: `${playbackProgress}%` }"
    @mousedown="handleDragStart"
  ></div>
</div>
<div class="progress-text">{{ currentTime }} / {{ totalTime }}</div>

<!-- 控制按钮 -->
<div class="control-buttons">
  <button class="control-btn terminal-btn" @click="openTerminal">
    <img src="@/assets/UI/终端白色.svg" alt="Record">
  </button>
  <div class="playback-buttons">
    <button class="control-btn" @click="togglePlayback">
      <div v-if="isPaused || !isPlaying" class="play-icon"></div>
      <div v-else class="pause-icon">
        <div class="pause-line"></div>
        <div class="pause-line"></div>
      </div>
    </button>
    <button class="control-btn" @click="stopPlayback">
      <div class="stop-icon"></div>
    </button>
  </div>
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
            <span>上传配置文件</span>
          </button>
          <button class="btn btn-blue" @click="handleDocDownload">
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
        <div class="markdown-preview" v-if="markdownContent">
          <div class="markdown-content" v-html="markdownContent"></div>
        </div>
      </div>
    </template>

    <!-- 删除片段页面 -->
    <template v-if="currentTab === '删除片段'">
      <div class="delete-container">
        <button class="btn btn-danger" @click="handleDelete">
          <img src="@/assets/UI/删除.svg" alt="删除">
          <span>删除片段</span>
        </button>
        <p class="delete-warning">片段一旦删除，不可恢复！如非片段开发者本人，请致电咨询。</p>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { marked } from 'marked'
import fragmentService from '@/services/fragmentService'
import fileService from '@/services/fileService'

export default {
  name: 'FragmentDetail',
  
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    // 基础状态
    const currentTab = ref('基本')
    const fragmentTabs = ['基本', '函数', '使用文档', '删除片段']
    const uploadedDoc = ref(null)
    const uploadedWindFile = ref(null)
    const uploadedRainFile = ref(null)
    const runMode = ref('')
    const markdownContent = ref('')
    const isDragging = ref(false);
    
    // 获取项目ID和片段ID
    const projectId = route.query.projectId
    const fragmentId = route.params.id
    
    // 片段表单数据
    const fragmentData = ref({
      title: '',
      creator: '',
      password: '',
      contact: '',
      description: ''
    })

// 播放控制相关计算属性
const isPlaying = computed(() => store.state.fragmentPlayback.isPlaying)
const isPaused = computed(() => store.state.fragmentPlayback.isPaused)
const matrixColors = computed(() => store.getters['fragmentPlayback/matrixColors'])
const playbackProgress = computed(() => store.getters['fragmentPlayback/playbackProgress'])
const currentTime = computed(() => store.getters['fragmentPlayback/currentTime'])
const totalTime = computed(() => store.getters['fragmentPlayback/totalTime'])

    // 加载片段信息
    const loadFragmentInfo = async () => {
      try {
        const info = await fragmentService.getFragmentInfo(projectId, fragmentId)
        if (info) {
          fragmentData.value = info
        }
      } catch (error) {
        console.error('获取片段信息失败:', error)
      }
    }

    // 获取风扇样式
const getFanStyle = (groupIndex, fanIndex) => {
  if (!matrixColors.value) {
    return { backgroundColor: 'rgb(232, 232, 232)' };
  }

  const rowGroup = Math.floor(groupIndex / 12);
  const colGroup = groupIndex % 12;
  const subRow = Math.floor(fanIndex / 3);
  const subCol = fanIndex % 3;
  const row = rowGroup * 3 + subRow;
  const col = colGroup * 3 + subCol;
  
  // 添加越界检查
  if (row >= 36 || col >= 36 || row < 0 || col < 0) {
    return { backgroundColor: 'rgb(232, 232, 232)' };
  }
  
  return {
    backgroundColor: matrixColors.value[row][col]
  };
};

// 播放控制
const togglePlayback = () => {
  if (!isPlaying.value) {
    store.dispatch('fragmentPlayback/startPlayback');
  } else if (isPaused.value) {
    store.dispatch('fragmentPlayback/resumePlayback');
  } else {
    store.dispatch('fragmentPlayback/pausePlayback');
  }
};

const stopPlayback = () => {
  store.dispatch('fragmentPlayback/stopPlayback')
}

    // 终端控制
    const openTerminal = () => {
  try {
    const terminalWindow = window.open('/terminal.html', '_blank');
    if (terminalWindow) {
      store.commit('fragmentPlayback/SET_TERMINAL_WINDOW', true);
      
      // 监听终端窗口关闭
      const checkInterval = setInterval(() => {
        if (terminalWindow.closed) {
          clearInterval(checkInterval);
          store.commit('fragmentPlayback/SET_TERMINAL_WINDOW', false);
        }
      }, 1000);
    } else {
      alert('弹窗被浏览器阻止，请允许弹窗后重试');
    }
  } catch (error) {
    console.error('打开终端窗口失败:', error);
  }
};

//每次上传新csv文件后重新处理产生pwm文件
const handleWindUpload = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // 首先读取文件获取模板ID
        const reader = new FileReader();
        const templateId = await new Promise((resolve, reject) => {
          reader.onload = (event) => {
            const firstLine = event.target.result.split('\n')[0];
            const fields = firstLine.split(',');
            if (fields[1] && fields[1].trim()) {
              resolve(fields[1].trim());
            } else {
              reject(new Error('无效的模板ID'));
            }
          };
          reader.onerror = () => reject(new Error('读取文件失败'));
          reader.readAsText(file);
        });

        // 上传 CSV 文件
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await fileService.uploadFragmentConfig(
          projectId,
          fragmentId,
          'wind',
          file
        );

        if (uploadResult.success) {
          uploadedWindFile.value = {
            name: file.name,
            fullName: uploadResult.filename
          };

          // CSV 上传成功后立即进行处理
          const csvPath = `data/csv_files/fragment/${uploadResult.filename}`;
          const processResult = await fileService.processFragmentFile(
            csvPath,
            fragmentId,
            projectId,
            templateId,
            true  // 添加一个强制处理的标志
          );

          if (processResult.success) {
            // 加载新生成的 PWM 数据进行播放
            await store.dispatch('fragmentPlayback/loadPlaybackData', processResult.processedFile);
          }
        }
      } catch (error) {
        console.error('上传失败:', error);
        uploadedWindFile.value = null;
      }
    }
  };
  input.click();
};
    const handleRainUpload = async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.csv'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          try {
            uploadedRainFile.value = file
            const result = await fileService.uploadFragmentConfig(
              projectId,
              fragmentId,
              'rain',
              file
            )
            if (result.success) {
              uploadedRainFile.value = {
                name: file.name,
                fullName: result.filename
              }
            }
          } catch (error) {
            console.error('文件上传失败:', error)
            uploadedRainFile.value = null
          }
        }
      }
      input.click()
    }

    // 文件下载处理
    const handleWindDownload = async () => {
      if (uploadedWindFile.value?.fullName) {
        try {
          await fragmentService.downloadFragmentConfig(
            projectId,
            fragmentId,
            'wind',
            uploadedWindFile.value.fullName
          )
        } catch (error) {
          console.error('下载失败:', error)
        }
      }
    }

    const handleRainDownload = async () => {
      if (uploadedRainFile.value?.fullName) {
        try {
          await fragmentService.downloadFragmentConfig(
            projectId,
            fragmentId,
            'rain',
            uploadedRainFile.value.fullName
          )
        } catch (error) {
          console.error('下载失败:', error)
        }
      }
    }

    // 文档相关处理
    const handleDocUpload = async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          try {
            uploadedDoc.value = file
            const reader = new FileReader()
            reader.onload = async (event) => {
              await fragmentService.uploadFragmentDocument(projectId, fragmentId, file)
              markdownContent.value = marked(event.target.result)
            }
            reader.readAsText(file)
          } catch (error) {
            console.error('文档上传失败:', error)
            alert('上传失败，请重试')
            uploadedDoc.value = null
            markdownContent.value = ''
          }
        }
      }
      input.click()
    }

    const handleDocDownload = async () => {
      try {
        await fragmentService.downloadFragmentDocument(projectId, fragmentId)
      } catch (error) {
        console.error('下载文档失败:', error)
        alert('下载失败，请重试')
      }
    }

    // 运行模式设置
    const setRunMode = (mode) => {
      if (!uploadedWindFile.value) {
        alert('请先上传配置文件')
        return
      }
      runMode.value = mode

  // 通知服务器切换仿真模式
  if (store.state.fragmentPlayback.ws) {
    store.state.fragmentPlayback.ws.send(JSON.stringify({
      type: 'SET_RUN_MODE',
      mode
    }));
  }
    }

    // 基本信息处理
    const handleSave = async () => {
      try {
        await fragmentService.updateFragmentInfo(
          projectId,
          fragmentId,
          fragmentData.value
        )
        alert('保存成功')
      } catch (error) {
        console.error('保存失败:', error)
        alert('保存失败，请重试')
      }
    }

    const handleCancel = () => {
      router.push({
        path: '/experiment/edit',
        query: { projectId }
      })
    }

    const handleDelete = async () => {
  if (confirm('确定要删除该片段吗？此操作不可恢复！')) {
    try {
      const projectId = route.query.projectId;
      const fragmentId = route.params.id;
      await fragmentService.deleteFragment(projectId, fragmentId);
      // 删除成功后跳转回片段列表页面
      router.push({
        path: '/experiment/edit',
        query: { projectId }
      });
    } catch (error) {
      console.error('删除片段失败:', error);
      alert('删除失败，请重试');
    }
  }
};

    // 标签切换
    const switchTab = (tab) => {
      currentTab.value = tab
      if (tab === '使用文档') {
        handleGetDocument()
      } else if (tab === '函数') {
        loadConfigFiles()
      }
    }

    // 获取文档
    const handleGetDocument = async () => {
      if (projectId && fragmentId) {
        try {
          const doc = await fragmentService.getFragmentDocument(projectId, fragmentId)
          if (doc && doc.content) {
            markdownContent.value = marked(doc.content)
            uploadedDoc.value = { name: doc.filename }
          }
        } catch (error) {
          console.error('获取文档失败:', error)
        }
      }
    }

// 加载配置文件
const loadConfigFiles = async () => {
  try {
    const configFiles = await fragmentService.getFragmentConfigFile(projectId, fragmentId);
    
    // 处理风配置文件
    if (configFiles?.windConfig) {
      // 设置文件显示信息
      uploadedWindFile.value = {
        name: configFiles.windConfig.split('-').slice(2).join('-'),
        fullName: configFiles.windConfig
      };
      
      try {
        // 获取模板ID
        const templateId = await readFirstLineOfCSV(configFiles.windConfig);
        console.log('获取到的模板ID:', templateId); // 添加调试日志
        
        if (!templateId) {
          throw new Error('无效的模板ID');
        }

        // 构建CSV文件路径
        const csvFilename = configFiles.windConfig; // 直接使用文件名

        // 处理文件并获取PWM数据
        const result = await fileService.processFragmentFile(
          csvFilename, 
          fragmentId, 
          projectId, 
          templateId
        );
        
        if (result.success) {
          // 加载播放数据
          await store.dispatch('fragmentPlayback/loadPlaybackData', result.processedFile);
        }
      } catch (error) {
        console.error('处理wind配置文件失败:', error);
        throw error;
      }
    }

    // 处理雨配置文件
    if (configFiles?.rainConfig) {
      uploadedRainFile.value = {
        name: configFiles.rainConfig.split('-').slice(2).join('-'),
        fullName: configFiles.rainConfig
      };
    }
  } catch (error) {
    console.error('加载配置文件失败:', error);
    // 可以添加用户提示
    alert('加载配置文件失败，请检查文件格式');
  }
};

const readFirstLineOfCSV = async (filename) => {
  try {
    // 发送请求获取第一行数据
    const response = await fetch(`http://${window.location.hostname}:3000/api/csv/firstline/${filename}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error('读取CSV失败:', data.message);
      throw new Error(data.message || '读取CSV文件失败');
    }
    
    return data.templateId;
  } catch (error) {
    console.error('读取CSV第一行失败:', error);
    // 重新抛出错误，让上层函数处理
    throw new Error(`读取CSV文件失败: ${error.message}`);
  }
};

const handleProgressClick = (e) => {
    if (!isPlaying.value) return;
    
    const rect = e.target.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const frameNumber = Math.floor(store.state.fragmentPlayback.totalFrames * percentage);
    store.dispatch('fragmentPlayback/seekTo', frameNumber);
};

const handleDragStart = () => {
    if (!isPlaying.value) return;
    
    isDragging.value = true;
    store.dispatch('fragmentPlayback/pausePlayback');
    
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
};

const handleDrag = (e) => {
    if (!isDragging.value) return;
    
    const progressBar = document.querySelector('.progress-bar');
    const rect = progressBar.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const frameNumber = Math.floor(store.state.fragmentPlayback.totalFrames * percentage);
    
    store.dispatch('fragmentPlayback/seekTo', frameNumber);
};

const handleDragEnd = () => {
    if (!isDragging.value) return;
    
    isDragging.value = false;
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('mouseup', handleDragEnd);
};

    // 生命周期钩子
    onMounted(async () => {
    try {
        await loadFragmentInfo();
        await store.dispatch('fragmentPlayback/connectWebSocket');
        
        if (currentTab.value === '函数') {
            await loadConfigFiles();
        } else if (currentTab.value === '使用文档') {
            await handleGetDocument();
        }
    } catch (error) {
        console.error('组件初始化失败:', error);
    }
});

onUnmounted(() => {
  store.dispatch('fragmentPlayback/stopPlayback');
  handleDragEnd();
  uploadedDoc.value = null;
  // 清理防抖定时器
  if (store.state.fragmentPlayback.seekDebounceTimer) {
    clearTimeout(store.state.fragmentPlayback.seekDebounceTimer);
  }
  // 清理 websocket
  const ws = store.state.fragmentPlayback.ws;
  if (ws) {
    ws.close();
  }
  store.commit('fragmentPlayback/SET_TERMINAL_WINDOW', false);
  store.dispatch('fragmentPlayback/clearPlaybackData');
});

    return {
      currentTab,
      fragmentTabs,
      fragmentData,
      uploadedWindFile,
      uploadedRainFile,
      runMode,
      uploadedDoc,
      markdownContent,
      isPlaying,
      isPaused,
      playbackProgress,
      currentTime,
      totalTime,
      matrixColors,
      handleWindUpload,
      handleRainUpload,
      handleWindDownload,
      handleRainDownload,
      setRunMode,
      handleSave,
      handleCancel,
      handleDelete,
      switchTab,
      handleDocUpload,
      handleDocDownload,
      getFanStyle,
      togglePlayback,
      stopPlayback,
      openTerminal,
      handleProgressClick,
      handleDragStart,
      isDragging,
      handleDrag,
      handleDragEnd
    }
  }
}
</script>

<style lang="scss" scoped>
/* 基础样式 */
.fragment-detail {
  padding: 1vw;
}

/* 标签页样式 */
.experiment-tabs {
  display: flex;
  gap: 3vw;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: -1vw;
  padding-bottom: 0.25vw;
  margin: -0.7vw -0.6vw;
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

  &::after {
    content: '';
    position: absolute;
    bottom: -0.3vw;
    left: 50%;
    width: 0; // 初始宽度为0
    height: 2.5px;
    background-color: #00A0E9;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  &:hover::after {
    width: 100%;
  }

  &.active {
    color: #00A0E9;
    
    &::after {
      width: 100%;
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
  margin: 1.5vw -1vw 1.5vw;
  
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

/* 函数页面样式 */
.function-container {
  margin: 0.5vw -2vw;
  padding: 1vw 2vw;
  display: flex;
  gap: 1vw;
}

.left-content {
  width: 32vw;
}

.action-buttons-row {
  display: flex;
  gap: 1vw;
  margin-left: -1vw;
  margin-bottom: 1vw;
}

.file-display {
  background: transparent;
  border-radius: 0.3vw;
  padding: 0.8vw;
  display: flex;
  align-items: center;
  margin: 1vw -1vw;
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

.run-buttons {
  display: flex;
  gap: 1vw;
  margin-top: 1vw;
  margin-left: -1vw;
  width: 32vw;
}

.run-button {
  flex: 1;
  padding: 0.8vw;
  border: 1px solid #00A0E9;
  border-radius: 0.3vw;
  background: white;
  color: #00A0E9;
  font-size: 0.9vw;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #f0f9ff;
  }

  &.active {
    background: #00A0E9;
    color: white;
  }
}

.simulate-hint {
  color: #666;
  font-size: 0.8vw;
  margin-top: 0.8vw;
  margin-left: -0.5vw;
}

/* 右侧内容和网格样式 */
.right-content {
  display: flex;
  flex-direction: column;
  gap: 1vw;
  margin: -1vw 1vw;
}

.fan-grid-container {
  flex: 1;
  background-color: white;
  padding: 1vw;
  border-radius: 0.5vw;
  margin-top: 0;
  aspect-ratio: 1;
  width: 100%;
}

.fan-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
  aspect-ratio: 1;
  background-color: white;
  padding: 2px;
}

.fan-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5px;
  background-color: white;
}

.fan {
  aspect-ratio: 1;
  background-color: rgb(232, 232, 232);
  width: 0.55vw;
}

/* 渐变条样式 */
.gradient-bar {
  width: 100%;
}

.color-gradient {
  display: flex;
  height: 0.7vw;
}

.gradient-segment {
  flex: 1;
  height: 100%;

  &:nth-child(1) { background-color: #B2DEF8; }
  &:nth-child(2) { background-color: #9FD4F2; }
  &:nth-child(3) { background-color: #8CC9EC; }
  &:nth-child(4) { background-color: #79BFE6; }
  &:nth-child(5) { background-color: #66B4E0; }
  &:nth-child(6) { background-color: #53AADA; }
  &:nth-child(7) { background-color: #409FD4; }
  &:nth-child(8) { background-color: #2D95CE; }
  &:nth-child(9) { background-color: #1A8AC8; }
  &:nth-child(10) { background-color: #005474; }
}

.gradient-labels {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  margin-top: 0.3vw;
  
  span {
    text-align: center;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7vw;
    color: #666;
  }
}

/* 控制面板样式 */
.control-panel {
  margin-top: -1vw;
}

.progress-bar {
  width: 100%;
  height: 0.3vw;
  background-color: rgb(232, 232, 232);
  border-radius: 0.15vw;
  margin: 1.5vw 0;
  position: relative;
}

.progress {
  width: 25%;
  height: 100%;
  background-color: #00A0E9;
  border-radius: 0.15vw;
}

.progress-handle {
  width: 1vw;
  height: 1vw;
  background-color: #00A0E9;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 25%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after {
    content: '';
    width: 0.4vw;
    height: 0.4vw;
    background-color: white;
    border-radius: 50%;
  }
}

.progress-text {
  text-align: center;
  font-size: 0.9vw;
  color: #333;
  margin: -1vw 0 0.7vw 0;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 0 2.5vw;

  .terminal-btn {
    position: absolute;
    left: 0;
  }

  .playback-buttons {
    display: flex;
    gap: 1vw;
  }
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

/* 播放控制图标样式 */
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

/* 使用文档样式 */
.doc-container {
  margin: 0.5vw -2vw;
  padding: 1vw 2vw;
  width: 40vw;

  .action-buttons {
    display: flex;
    margin-left: -1vw;
    gap: 1vw;
  }
}

.markdown-preview {
  width: 32vw;
  height: calc(100vh - 18.5vw);
  background: white;
  border-radius: 0.5vw;
  margin-top: 1vw;
  margin-left: -1vw;
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
  margin: 0.5vw -2vw;
  padding: 1vw 2vw;

  .btn-danger {
    margin-bottom: 1vw;
    margin-left: -1vw;
    
    &:hover {
      background-color: darken(#e40041, 10%);
    }
  }

  .delete-warning {
    color: #e40041;
    font-size: 0.8vw;
    margin-left: -1vw;
  }
}

/* 按钮通用样式 */
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
</style>