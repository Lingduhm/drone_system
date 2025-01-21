<template>
    <div class="test-motion">
      <!-- 右侧内容区域 -->
      <div class="right-content">
        <!-- 顶部容器行 - 空白区域 -->
        <div class="containers-row">
          <div class="empty-container"></div>
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
                <tr v-for="record in xyzRecords" :key="record.id">
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
            <!-- 控制按钮组 -->
            <button class="control-btn terminal-btn" @click="record">
              <img src="@/assets/UI/终端白色.svg" alt="Record">
            </button>
            <!-- 播放控制按钮组 -->
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
    </div>
  </template>
  
  <script>
  import { computed } from 'vue'
  import { useStore } from 'vuex'
  
  export default {
    name: 'TestMotion',
    
    setup() {
      const store = useStore()
      // 获取xyz数据
      const xyzRecords = computed(() => store.getters['experiments/xyzData'])
  
      // 控制按钮方法
      const togglePause = () => {
        store.dispatch('experiments/togglePlayback')
      }
  
      const play = () => {
        console.log('Play')
      }
  
      const stop = () => {
        store.dispatch('experiments/stopPlayback')
      }
  
      const record = () => {
        console.log('Record')
      }
  
      return {
        xyzRecords,
        togglePause,
        play,
        stop,
        record
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  // 页面主容器
  .test-motion {
    display: flex;
    flex-direction: column;
    padding: 1vw;
    gap: 1vw;
    margin-top: 0vw;
    margin-left: -1vw;
  }
  
  // 右侧内容区域
  .right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1vw;
    width: 30vw;
    margin: -1vw;
  }
  
  // 容器行通用样式
  .containers-row {
    display: flex;
    gap: 1vw;
  }
  
  // 空白容器样式
  .empty-container {
    flex: 1;
    background-color: rgb(232, 232, 232);
    padding: 1vw;
    border-radius: 0.5vw;
    aspect-ratio: 1;
    width: 100%;
  }
  
  // 表格容器样式
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
  
  // 表格样式
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
  
  // 控制容器样式
  .control-container {
    width: 100%;
    background: (242,242,242);
    border-radius: 0.5vw;
    padding: 1vw;
    display: flex;
    position: relative;
  }
  
  // 终端按钮样式
  .terminal-btn {
    position: absolute;
    left: 1vw;
  }
  
  // 播放控制按钮组
  .playback-buttons {
    display: flex;
    gap: 1vw;
    margin: 0 auto;
  }
  
  // 控制按钮通用样式
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
  
    img {
      width: 1.2vw;
      height: 1.2vw;
    }
  }
  
  // 暂停图标样式
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
  
  // 播放图标样式
  .play-icon {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0.7vw 0 0.7vw 1.2vw;
    border-color: transparent transparent transparent white;
    margin-left: 0.2vw;
  }
  
  // 停止图标样式
  .stop-icon {
    width: 1vw;
    height: 1vw;
    background-color: white;
    border-radius: 0.1vw;
  }
  </style>