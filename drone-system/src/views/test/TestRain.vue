<template>
    <div class="test-rain">
      <!-- 文件操作区域 -->
      <div class="file-operation">
        <!-- 上传下载按钮 -->
        <div class="action-buttons-row">
          <button class="btn btn-blue" @click="handleUpload">
            <img :src="uploadIcon" alt="上传" class="button-icon">
            <span>上传配置文件</span>
          </button>
          <button class="btn btn-blue">
            <img :src="downloadIcon" alt="下载" class="button-icon">
            <span>下载配置文件</span>
          </button>
        </div>
  
        <!-- 文件显示区域 -->
        <div class="file-display" v-if="uploadedFile">
          <img :src="fileIcon" class="file-icon">
          <span class="file-name">{{ uploadedFile.name }}</span>
          <img :src="checkIcon" class="check-icon">
        </div>
  
        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress" :style="{ width: progressWidth }"></div>
            <div class="progress-handle" :style="{ left: progressWidth }"></div>
          </div>
          <div class="progress-text">{{ currentTime }} / {{ totalTime }}</div>
        </div>
  
        <!-- 播放控制器 -->
        <div class="control-container">
          <button class="control-btn terminal-btn">
            <img :src="terminalIcon" alt="Record">
          </button>
          <div class="playback-buttons">
            <button class="control-btn" @click="togglePause">
              <div class="pause-icon">
                <div class="pause-line"></div>
                <div class="pause-line"></div>
              </div>
            </button>
            <button class="control-btn" @click="play">
              <div class="play-icon"></div>
            </button>
            <button class="control-btn" @click="stop">
              <div class="stop-icon"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
import { ref } from 'vue'
import fileService from '@/services/fileService';

export default {
 name: 'TestRain',
 
 setup() {
   const uploadedFile = ref(null);
   const currentTime = ref('1:00');
   const totalTime = ref('4:00');
   const progressWidth = ref('25%');

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
           console.log('雨雾测试文件上传成功:', result);
         } catch (error) {
           console.error('文件上传失败:', error);
         }
       }
     };
     input.click();
   };

   const togglePause = () => {
     console.log('Toggle Pause');
   };

   const play = () => {
     console.log('Play');
   };

   const stop = () => {
     console.log('Stop');
   };

   return {
     uploadedFile,
     currentTime,
     totalTime, 
     progressWidth,
     handleUpload,
     togglePause,
     play,
     stop,
     // 图标路径
     uploadIcon: require('@/assets/UI/上传白色.svg'),
     downloadIcon: require('@/assets/UI/下载白色.svg'),
     fileIcon: require('@/assets/UI/文件蓝色.svg'),
     checkIcon: require('@/assets/UI/确认蓝色.svg'),
     terminalIcon: require('@/assets/UI/终端白色.svg')
   };
 }
};
</script>

  
  <style lang="scss" scoped>
  .test-rain {
    padding: 1vw;
  }
  
  .file-operation {
    display: flex;
    flex-direction: column;
    width: 30vw;
    gap: 1vw;
    margin: -1vw;
    margin-left: -2vw;
  }
  
  .action-buttons-row {
    display: flex;
    gap: 1vw;
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
    background: white;
    border-radius: 0.3vw;
    padding: 0.8vw;
    display: flex;
    align-items: center;
  
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
  
  .progress-section {
    margin: 1vw 0;
    width: 30vw;
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
  }
  
  .control-container {
    background:(242, 242, 242);
    border-radius: 0.5vw;
    padding: 1vw;
    display: flex;
    position: relative;
    margin-top: -2vw;
  }
  
  .terminal-btn {
    position: absolute;
    left: 1vw;
  }
  
  .playback-buttons {
    display: flex;
    gap: 1vw;
    margin: 0 auto;
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