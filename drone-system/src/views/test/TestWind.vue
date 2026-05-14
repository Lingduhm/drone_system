<template>
  <div class="wind-test">
    <!-- 左侧内容 -->
    <div class="left-content">
      <!-- 文件上传和下载按钮 -->
      <div class="action-buttons-row">
        <button class="btn btn-blue" @click="handleUpload">
          <img src="@/assets/UI/上传白色.svg" alt="上传" class="button-icon">
          <span>上传配置文件</span>
        </button>
        <button class="btn btn-blue" @click="handleDownload" :disabled="!uploadedFile">
          <img src="@/assets/UI/下载白色.svg" alt="下载" class="button-icon">
          <span>下载配置文件</span>
        </button>
      </div>

      <!-- 文件显示区域 -->
      <div class="file-display" v-if="uploadedFile">
        <img src="@/assets/UI/文件蓝色.svg" class="file-icon">
        <span class="file-name">{{ uploadedFile.name }}</span>
        <img src="@/assets/UI/确认蓝色.svg" class="check-icon">
      </div>

      <!-- 运行按钮区域 -->
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
    </div>

    <!-- 右侧内容 -->
    <div v-show="runMode" class="right-content">
      <!-- 风扇网格容器 -->
      <div class="fan-grid-container">
        <div class="fan-grid">
          <div 
            v-for="group in 144" 
            :key="group"
            class="fan-group"
          >
            <div 
              v-for="fan in 9" 
              :key="fan"
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
        <div 
          class="progress-bar" 
          @click="handleProgressClick"
        >
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

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';  
import { useStore } from 'vuex'
import fileService from '@/services/fileService'

export default {
  name: 'TestWind',

  setup() {
    const store = useStore();
    const uploadedFile = ref(null);
    const runMode = ref('');
    const isDragging = ref(false);

    // 计算属性
    const isPlaying = computed(() => store.state.windTest.isPlaying);
    const isPaused = computed(() => store.state.windTest.isPaused);
    const playbackProgress = computed(() => store.getters['windTest/playbackProgress']);
    const currentTime = computed(() => store.getters['windTest/currentTime']);
    const totalTime = computed(() => store.getters['windTest/totalTime']);
    const matrixColors = computed(() => store.getters['windTest/matrixColors']);
    
    // 在组件挂载时建立WebSocket连接
    onMounted(async () => {
        await store.dispatch('windTest/connectWebSocket');
    });

// 获取风扇样式
const getFanStyle = (groupIndex, fanIndex) => {
  if (!matrixColors.value) {
    console.log('No matrix colors available');
    return { backgroundColor: 'rgb(232, 232, 232)' };
  }

  const rowGroup = Math.floor(groupIndex / 12);
  const colGroup = groupIndex % 12;
  const subRow = Math.floor(fanIndex / 3);
  const subCol = fanIndex % 3;
  const row = rowGroup * 3 + subRow;
  const col = colGroup * 3 + subCol;
  
  if (row >= 36 || col >= 36) {
    console.log(`Invalid position: row=${row}, col=${col}`);
    return { backgroundColor: 'rgb(232, 232, 232)' };
  }
  
  const color = matrixColors.value[row][col];
  return { backgroundColor: color };
};

    const handleUpload = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const result = await fileService.uploadAndProcessWindCSV(formData);
            if (result.success) {
              uploadedFile.value = {
                name: file.name,
                fullName: result.originalFile,
                processedFile: result.processedFile
              };
              await store.dispatch('windTest/loadPlaybackData', result.processedFile);
            }
          } catch (error) {
            console.error('上传失败:', error);
            uploadedFile.value = null;
          }
        }
      };
      input.click();
    };

    const handleDownload = async () => {
      if (uploadedFile.value?.fullName) {
        try {
          await fileService.downloadTestFile(uploadedFile.value.fullName);
        } catch (error) {
          console.error('下载失败:', error);
        }
      }
    };

    const setRunMode = (mode) => {
      if (!uploadedFile.value) {
        alert('请先上传配置文件');
        return;
      }
      runMode.value = mode;

      // 通知服务器切换模式
      store.state.windTest.ws?.send(JSON.stringify({
      type: 'SET_RUN_MODE',
      mode
      }));
    };

    const togglePlayback = () => {
      if (!isPlaying.value) {
        store.dispatch('windTest/startPlayback');
      } else if (isPaused.value) {
        store.dispatch('windTest/resumePlayback');
      } else {
        store.dispatch('windTest/pausePlayback');
      }
    };

    const stopPlayback = () => {
      store.dispatch('windTest/stopPlayback');
    };

   // 修改拖动进度条相关方法
   const handleProgressClick = (e) => {
            if (!isPlaying.value) return;
            
            const rect = e.target.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            const frameNumber = Math.floor(store.state.windTest.totalFrames * percentage);
            store.dispatch('windTest/seekTo', frameNumber);
        };

        const handleDragStart = () => {  // 移除未使用的参数 e
            if (!isPlaying.value) return;
            
            isDragging.value = true;
            // 拖动时暂停播放
            store.dispatch('windTest/pausePlayback');
            
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', handleDragEnd);
        };

        const handleDrag = (e) => {
            if (!isDragging.value) return;
            
            const progressBar = document.querySelector('.progress-bar');
            const rect = progressBar.getBoundingClientRect();
            const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const frameNumber = Math.floor(store.state.windTest.totalFrames * percentage);
            
            store.dispatch('windTest/seekTo', frameNumber);
        };

        const handleDragEnd = () => {
            if (!isDragging.value) return;
            
            isDragging.value = false;
            // 拖动结束后恢复播放
            store.dispatch('windTest/resumePlayback');
            
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', handleDragEnd);
        };


const openTerminal = () => {
    try {
        const terminalWindow = window.open('/terminal.html', '_blank');
        if (terminalWindow) {
            store.commit('windTest/SET_TERMINAL_WINDOW', true);
            
            // 使用定时器检查终端标签页是否关闭
            const checkInterval = setInterval(() => {
                if (terminalWindow.closed) {
                    clearInterval(checkInterval);
                    store.commit('windTest/SET_TERMINAL_WINDOW', false);
                }
            }, 1000);
            
        } else {
            alert('弹窗被浏览器阻止,请允许弹窗后重试');
        }
    } catch (error) {
        console.error('打开终端窗口失败:', error);
    }
};

// 清理窗口引用
onUnmounted(() => {
        store.dispatch('windTest/stopPlayback');
        handleDragEnd();
        // 清理上传状态
        uploadedFile.value = null;
        // 关闭WebSocket连接
        if (store.state.windTest.ws) {
            store.state.windTest.ws.close();
        }
    });


    return {
      uploadedFile,
      runMode,
      isPlaying,
      isPaused,
      playbackProgress,
      currentTime,
      totalTime,
      handleUpload,
      handleDownload,
      setRunMode,
      togglePlayback,
      stopPlayback,
      handleProgressClick,
      handleDragStart,
      getFanStyle,
      openTerminal
    };
  }
};
</script>

<style lang="scss" scoped>
.wind-test {
  display: flex;
  gap: 1vw;
  padding: 1vw;
}

.left-content {
  width: 30vw;
  margin: -1vw;
  margin-left:-2vw;
}

.action-buttons-row {
  display: flex;
  gap: 1vw;
  margin-bottom: 1vw;
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

  &.btn-blue {
    background-color: #00A0E9;
  }

  .button-icon {
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
  border-top: 2px solid rgb(232, 232, 232);    // 添加这行
  border-bottom: 2px solid rgb(232, 232, 232);  // 添加这行


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

// 从ExperimentPage.vue复制的右侧样式
.right-content {
  display: flex;
  flex-direction: column;
  gap: 1vw;
  margin: -1vw 1vw;
}

.containers-row {
  display: flex;
  gap: 1vw;
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

.empty-container {
  flex: 1;
  background-color: rgb(232, 232, 232);
  padding: 1vw;
  border-radius: 0.5vw;
  aspect-ratio: 1;
  width: 45%;
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
  aspect-ratio:1;
  background-color: rgb(232, 232, 232);
  width: 0.55vw;
}

.gradient-container {
  width: calc(49.2%);
  padding: 0;
  margin: 0;
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
  width: 100%;
  padding: 0;
  background-color: transparent;
  margin-top: -1vw;
}

/* 进度条样式 */
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

/* 控制按钮组样式 */
.control-buttons {
  display: flex;
  width: 100%;
  gap: 1vw;
  position: relative;
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
  padding: 0;

  &:hover {
    transform: scale(1.1);
  }
}

.terminal-btn {
  position: absolute;
  left: 0;
}

.playback-buttons {
  display: flex;
  gap: 1vw;
  margin: 0 auto;
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

</style>