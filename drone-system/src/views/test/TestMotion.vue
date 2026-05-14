<template>
  <div class="test-motion">
    <div class="right-content">
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
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ThreeScene from '@/components/ThreeScene.vue'

const MAX_FRAMES = 200 // 最大帧数
const FRAME_INTERVAL = 0.01 // 帧间隔（秒）

export default {
  name: 'TestMotion',
  
  components: {
    ThreeScene
  },

  setup() {
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

    // 计算要显示的记录，确保按时间顺序排列
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
      const expectedFrames = Math.floor(elapsedTime / 10) // 每10ms一帧

      // 如果需要更新
      if (expectedFrames > frameCount) {
        // 创建新记录
        const newRecord = {
          frameIndex: frameCount,
          time: formatTime(frameCount),
          x: lastPosition[0].toFixed(2),
          y: lastPosition[1].toFixed(2),
          z: lastPosition[2].toFixed(2)
        }

        // 添加新记录并维护最大帧数
        records.value.unshift(newRecord)
        if (records.value.length > MAX_FRAMES) {
          records.value = records.value.slice(0, MAX_FRAMES)
        }

        // 更新3D场景
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

      // 继续下一帧
      animationFrameId = requestAnimationFrame(updateFrame)
    }

    // 开始动画
    const startAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      startTime = Date.now()
      frameCount = 0
      animationFrameId = requestAnimationFrame(updateFrame)
    }

    // 停止动画
    const stopAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    // 处理来自服务器的数据
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

    // 连接WebSocket
    const connectWebSocket = () => {
      ws.value = new WebSocket(`ws://${window.location.hostname}:3000/mocap?type=test`);
      
      ws.value.onopen = () => {
        console.log('Connected to mocap WebSocket')
      }

      ws.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch(message.type) {
            case 'MOCAP_DATA':
              if (isPlaying.value && !isPaused.value) {
                handleMocapData(message)
              }
              break

            case 'ERROR':
              console.error('收到错误消息:', message.message)
              alert(message.message)
              isPlaying.value = false
              isPaused.value = false
              stopAnimation()
              break
          }
        } catch (error) {
          console.error('处理WebSocket消息时出错:', error)
        }
      }

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

    // 切换播放状态
    const togglePlayback = () => {
      if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
        connectWebSocket()
      }

      if (!isPlaying.value) {
        // 开始播放
        isPlaying.value = true
        isPaused.value = false
        records.value = []
        lastPosition = [0, 0, 0]
        startAnimation()
        ws.value.send(JSON.stringify({ type: 'START' }))
      } else if (isPaused.value) {
        // 继续播放
        isPaused.value = false
        startTime = Date.now() - (frameCount * 10)
        animationFrameId = requestAnimationFrame(updateFrame)
        ws.value.send(JSON.stringify({ type: 'RESUME' }))
      } else {
        // 暂停
        isPaused.value = true
        stopAnimation()
        ws.value.send(JSON.stringify({ type: 'PAUSE' }))
      }
    }

    // 停止播放
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

      // 重置3D场景
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

    onMounted(() => {
      connectWebSocket()
    })

    onUnmounted(() => {
      stopAnimation()
      if (ws.value) {
        ws.value.close()
      }
    })

    return {
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
.test-motion {
  display: flex;
  flex-direction: column;
  padding: 1vw;
  gap: 1vw;
  margin-top: 0vw;
  margin-left: -1vw;
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1vw;
  width: 30vw;
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