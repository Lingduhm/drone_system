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
        <button class="btn btn-blue">
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
            :key="'group-' + group" 
            class="fan-group"
          >
            <div 
              v-for="fan in 9" 
              :key="'fan-' + group + '-' + fan" 
              class="fan"
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
        <div class="progress-bar">
          <div class="progress"></div>
          <div class="progress-handle"></div>
        </div>
        <div class="progress-text">1:00 / 4:00</div>
        <div class="control-buttons">
          <button class="control-btn terminal-btn">
            <img src="@/assets/UI/终端白色.svg" alt="Record">
          </button>
          <div class="playback-buttons">
            <button class="control-btn">
              <div class="pause-icon">
                <div class="pause-line"></div>
                <div class="pause-line"></div>
              </div>
            </button>
            <button class="control-btn">
              <div class="play-icon"></div>
            </button>
            <button class="control-btn">
              <div class="stop-icon"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import fileService from '@/services/fileService';

export default {
  name: 'TestWind',

  setup() {
    const uploadedFile = ref(null);
    const runMode = ref('');  // 'simulate' 或 'real'

    const handleUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          uploadedFile.value = file;
          
          try {
            const result = await fileService.uploadTestFile(file);
            console.log('风洞测试文件上传成功:', result);
          } catch (error) {
            console.error('文件上传失败:', error);
          }
        }
      };
      input.click();
    };

    const setRunMode = (mode) => {
      if (!uploadedFile.value) {
        alert('请先上传配置文件');
        return;
      }
      runMode.value = mode;
    };

    return {
      uploadedFile,
      runMode,
      handleUpload,
      setRunMode
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