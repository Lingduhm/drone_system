<template>
  <div class="experiment-page">
    <!-- 左侧内容区域 -->
    <div class="left-content">
      <!-- 标题容器 -->
      <div class="title-container">
        <div class="form-title">
          <img src="@/assets/UI/实验蓝色.svg" alt="实验记录">
          <span>实验记录</span>
        </div>
      </div>

      <!-- 选择和搜索区域 -->
      <div class="action-buttons-row">
        <div class="main-dropdown">
  <div class="select-container" @click="toggleDropdown">
    <span>{{ selectedFragmentLabel }}</span>
    <img 
      src="@/assets/UI/展开蓝色.svg" 
      alt="arrow" 
      :class="['dropdown-arrow', { 'rotated': dropdownOpen }]"
      style="width: 1vw; height: 1vw;"
    >
  </div>
  <transition name="dropdown">
    <div v-if="dropdownOpen" class="dropdown-options">
      <div class="dropdown-scroll">
        <div 
          v-for="option in fragmentOptions" 
          :key="option.value"
          class="dropdown-option"
          @click="selectFragment(option.value)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>
  </transition>
</div>
        <div class="search-box">
          <img src="@/assets/UI/搜索蓝色.svg" alt="搜索">
          <input 
            type="text" 
            v-model="searchQuery" 
          >
        </div>
      </div>

      <!-- 操作按钮组 -->
      <div class="operation-buttons">
        <div class="action-buttons-row">
          <button class="btn btn-blue">
            <img src="@/assets/UI/保存白色.svg" alt="重命名">
            <span>重命名</span>
          </button>
          <button class="btn btn-red">
            <img src="@/assets/UI/删除.svg" alt="删除记录">
            <span>删除记录</span>
          </button>
        </div>
        <div class="action-buttons-row">
          <button class="btn btn-blue">
            <img src="@/assets/UI/下载白色.svg" alt="实验记录下载">
            <span>实验记录下载</span>
          </button>
          <button class="btn btn-blue">
            <img src="@/assets/UI/下载白色.svg" alt="所有记录打包下载">
            <span>所有记录打包下载</span>
          </button>
        </div>
      </div>

      <!-- 记录列表 -->
      <div class="records-container">
  <table class="records-table">
    <thead>
      <tr>
        <th></th>
        <th>记录名称</th>
        <th>实验时长</th>
        <th>实验时间</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="record in records" :key="record.id">
        <td>
          <button 
            class="select-btn" 
            :class="{ selected: record.selected }"
            @click="handleSelect(record)"
          ></button>
        </td>
        <td>{{ record.name }}</td>
        <td>{{ record.duration }}</td>
        <td>{{ record.time }}</td>
      </tr>
    </tbody>
  </table>
</div>
</div>

    <!-- 右侧内容区域 -->
    <div class="right-content">
      <!-- 顶部容器行 -->
      <div class="containers-row">
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

        <!-- 空白容器 -->
        <div class="empty-container"></div>
      </div>

      <!-- 渐变条行 -->
      <div class="containers-row">
        <div class="gradient-container">
          <div class="color-gradient">
            <div v-for="n in 10" :key="n" class="gradient-segment"></div>
          </div>
          <div class="gradient-labels">
            <span v-for="n in 10" :key="n">{{ n * 10 }}</span>
          </div>
        </div>
        <div style="flex: 1;"></div>
      </div>

      <!-- 控制面板行 -->
      <div class="containers-row">
        <div class="control-panel-container">
          <!-- 控制面板 -->
          <div class="control-panel">
            <!-- 实验标签页 -->
            <div class="experiment-tabs">
              <div 
                v-for="tab in tabs" 
                :key="tab"
                :class="['tab', { active: currentTab === tab }]"
                @click="currentTab = tab"
              >
                {{ tab }}
              </div>
            </div>

            <!-- 根据标签页显示不同内容 -->
            <template v-if="currentTab === '高级实验'">
              <div class="advanced-notice">
                <p class="notice-text">高级实验采用外部API全取代控制台实验功能，无法在控制台提供实验。</p>
                <p class="notice-text">高级实验不生成实验记录。</p>
                <div class="notice-buttons">
                  <button class="notice-btn" @click="handleClose">关闭</button>
                  <button class="notice-btn active" @click="handleStart">开启</button>
                </div>
              </div>
            </template>

            <!-- 回放界面 -->
            <template v-else-if="currentTab === '回放'">
  <div class="playback-notice">
    <!-- 提示文字 -->
    <p class="notice-tip" v-if="!selectedRecordForPlayback">
      请选中一条要回放的实验记录
    </p>
    
    <!-- 选中记录信息 -->
    <div class="track-info" v-if="selectedRecordForPlayback">
      <p class="notice-tip-active">您选中要回放的实验记录：</p>
      <div class="track-row">
        <span class="track-name">{{ selectedRecordForPlayback.name }}</span>
        <div class="track-details">
          <span>{{ selectedRecordForPlayback.duration }}</span>
          <span>{{ selectedRecordForPlayback.time }}</span>
        </div>
      </div>
    </div>

    <!-- 播放控件 - 始终显示 -->
    <div class="playback-controls">
      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress"></div>
        <div class="progress-handle"></div>
      </div>
      <!-- 进度文本 -->
      <div class="progress-text">1:00 / 5:00</div>
      <!-- 控制按钮组 -->
      <div class="control-buttons">
        <button class="control-btn terminal-btn">
          <img src="@/assets/UI/终端白色.svg" alt="Record">
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

            <!-- 实验记录内容 -->
            <template v-else>
              <!-- 实验片段选择 -->
              <div class="experiment-select">
                <div class="select-label">实验片段选择</div>
                <div class="select-container" @click="toggleControlDropdown">
                  <span>{{ controlSelectedFragmentLabel }}</span>
                  <img 
                    src="@/assets/UI/展开蓝色.svg" 
                    alt="arrow" 
                    :class="['dropdown-arrow', { 'rotated': controlDropdownOpen }]"
                    style="width: 1vw; height: 1vw;"
                  >
                </div>
                <!-- 下拉菜单选项 -->
                <transition name="dropdown">
                  <div v-if="controlDropdownOpen" class="dropdown-options">
                    <div class="dropdown-scroll">
                      <div 
                        v-for="option in controlFragmentOptions" 
                        :key="option.value"
                        class="dropdown-option"
                        @click="selectControlFragment(option.value)"
                      >
                        {{ option.label }}
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- 进度条 -->
              <div class="progress-bar">
                <div class="progress"></div>
                <div class="progress-handle"></div>
              </div>

              <!-- 进度文本 -->
              <div class="progress-text">1:00 / 4:00</div>

              <!-- 控制按钮组 -->
              <div class="control-buttons">
                <button class="control-btn terminal-btn">
                  <img src="@/assets/UI/终端白色.svg" alt="Record">
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
            </template>
          </div>

          <!-- 数据表格 -->
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
      </div>
    </div>
  </div>
</template>


<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ExperimentPage',
  
  setup() {
    const store = useStore()
    const searchQuery = ref('')
    const selectedFragment = ref('')
    const currentTab = ref('实验记录')
    const controlDropdownOpen = ref(false)
    const controlSelectedFragment = ref('A')

    // 标签页选项
    const tabs = ['实验记录', '高级实验', '回放']

    // 片段选项
    const controlFragmentOptions = [
      { value: 'A', label: '片段 A' },
      { value: 'B', label: '片段 B' },
      { value: 'C', label: '片段 C' }
    ]

    // 实验记录数据
    // 实验记录数据
const records = ref([
  {
    id: '1',
    name: 'track-1',
    duration: '300s',
    time: '2024-12-25 13:27:14',
    selected: false
  },
  {
    id: '2',
    name: '基础飞行测试',
    duration: '450s',
    time: '2024-12-25 14:30:22',
    selected: false
  },
  {
    id: '3',
    name: '涡流稳定实验A',
    duration: '600s',
    time: '2024-12-25 15:45:36',
    selected: false
  },
  {
    id: '4',
    name: '高空悬停测试',
    duration: '280s',
    time: '2024-12-25 16:20:45',
    selected: false
  }
])

    // 选中的记录
    const selectedRecord = computed(() => {
      return records.value ? records.value.find(record => record.selected) : null
    })

    const selectedRecordForPlayback = computed(() => {
  if (currentTab.value !== '回放') return null
  return records.value.find(record => record.selected)
})

    // XYZ数据
    const xyzRecords = computed(() => store.getters['experiments/xyzData'])

    // 计算当前选中的片段标签
    const controlSelectedFragmentLabel = computed(() => {
      const option = controlFragmentOptions.find(opt => opt.value === controlSelectedFragment.value)
      return option ? option.label : '请选择片段'
    })

    // 过滤记录
    const filteredRecords = computed(() => store.getters['experiments/filteredRecords'](searchQuery.value))

    // 切换选择状态
    const toggleSelect = (id) => {
      const record = records.value.find(r => r.id === id)
      if (record) {
        records.value.forEach(r => r.selected = false)  // 先取消所有选择
        record.selected = true  // 选中当前记录
      }
    }

    // 其他方法...
    const toggleControlDropdown = () => {
      controlDropdownOpen.value = !controlDropdownOpen.value
    }

    const selectControlFragment = (fragment) => {
      controlSelectedFragment.value = fragment
      controlDropdownOpen.value = false
    }

    const togglePause = () => {
      store.dispatch('experiments/togglePlayback')
    }

    const play = () => {
      console.log('Play')
    }

    const stop = () => {
      store.dispatch('experiments/stopPlayback')
    }

    const handleClose = () => {
      console.log('关闭高级实验')
    }

    const handleStart = () => {
      console.log('开启高级实验')
    }

    const handleSelect = (record) => {
    if (currentTab.value === '回放') {
      // 回放模式下单选
      records.value.forEach(r => r.selected = (r.id === record.id))
    } else {
      // 其他模式下多选
      record.selected = !record.selected
    }

  }

  const dropdownOpen = ref(false)
const selectedFragmentLabel = ref('应对变化涡流稳定性训练')

const fragmentOptions = [
  { value: '', label: '应对变化涡流稳定性训练' },
  { value: '1', label: '基础飞行训练' },
  { value: '2', label: '高级控制训练' }
]

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const selectFragment = (value) => {
  selectedFragment.value = value
  selectedFragmentLabel.value = fragmentOptions.find(opt => opt.value === value)?.label || ''
  dropdownOpen.value = false
}
    return {
      searchQuery,
      selectedFragment,
      currentTab,
      tabs,
      controlDropdownOpen,
      controlSelectedFragment,
      controlSelectedFragmentLabel,
      controlFragmentOptions,
      records,
      xyzRecords,
      filteredRecords,
      selectedRecord,  // 添加到返回值中
      toggleSelect,
      toggleControlDropdown,
      selectControlFragment,
      togglePause,
      play,
      stop,
      handleClose,
      handleStart,
      handleSelect,
      selectedRecordForPlayback,
      dropdownOpen,
  selectedFragmentLabel,
  fragmentOptions,
  toggleDropdown,
  selectFragment
    }
  }
}
</script>

<style lang="scss" scoped>
/* 基础样式 */
.experiment-page {
  display: flex;
  padding: 1vw;
  gap: 1vw;
  margin-top: 0vw;
  margin-left: -1vw;
}

/* 左侧内容样式 */
.left-content {
  flex: 0 0 32vw;
}

.title-container {
  width: 32vw;
  background-color: transparent;
  padding: 0.8vw 1vw;
  margin-bottom: 1vw;
  border-top: 2px solid rgb(232, 232, 232);
  border-bottom: 2px solid rgb(232, 232, 232);
}

.form-title {
  display: flex;
  align-items: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 3.2vw;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 2.5vw;
    background-color: rgb(232, 232, 232);
  }

  img {
    width: 2.5vw;
    height: 2.5vw;
    margin: 0 1vw 0 0;
  }

  span {
    font-size: 1.8vw;
    font-weight: bold;
    margin-left: 1vw;
  }
}

.action-buttons-row {
  display: flex;
  gap: 1vw;
  margin-bottom: 1vw;
}



.search-box {
  width: 15.5vw;
  position: relative;

  input {
    width: 100%;
    height: 2.8vw;
    box-sizing: border-box;
    padding: 0.7vw 2.5vw 0.7vw 1vw;
    border: 1px solid #e0e0e0;
    border-radius: 0.3vw;
    background-color: white;
    font-size: 0.9vw;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: #00A0E9;
    }
  }

  img {
    position: absolute;
    right: 0.8vw;
    top: 50%;
    transform: translateY(-50%);
    width: 1.2vw;
    height: 1.2vw;
    transition: all 0.3s ease;
  }

  &:hover {
    input {
      border-color: #00A0E9;
    }

    img {
      transform: translateY(-50%) scale(1.1);
    }
  }
}

.btn {
  padding: 0.7vw 1vw;
  border: none;
  border-radius: 0.3vw;
  cursor: pointer;
  font-size: 0.9vw;
  color: white;
  display: flex;
  align-items: center;
  position: relative;
  width: 15.5vw;
  transition: transform 0.3s, background-color 0.3s;

  img {
    width: 1.2vw;
    height: 1.2vw;
    margin-right: 1vw;
  }

  &::after {
    content: '';
    position: absolute;
    left: 3vw;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 1.5vw;
    background-color: rgba(255, 255, 255, 0.5);
  }

  span {
    margin-left: 1vw;
    white-space: nowrap;
  }

  &:hover {
    transform: scale(1.05);
  }

  &-blue {
    background-color: #00A0E9;
    &:hover {
      background-color: #0085c2;
    }
  }

  &-red {
    background-color: #e40041;
    &:hover {
      background-color: #c20036;
    }
  }
}
.records-container {
  background: white;
  border-radius: 0.5vw;
  margin-top: 1vw;
  height: 50vh;
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

.records-table {
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
    z-index: 1;
  }

  td {
    padding: 0.6vw 0.8vw;
    text-align: center;
    font-size: 0.85vw;
    color: #666;
    border-bottom: 1px solid #f0f0f0;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover {
    background-color: #f8f8f8;
  }
  
  th:first-child,
  td:first-child {
    padding-left: 1.6vw;
    width: 3vw;
    text-align: center;
  }
}

.select-btn {
  width: 1.2vw;
  height: 1.2vw;
  background-color: #00A0E9;
  border: none;
  border-radius: 10vw;
  cursor: pointer;
  position: relative;
  padding: 0;
  margin-right: 0.8vw;
  transition: background-color 0.3s;
  vertical-align: middle;

  &.selected::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0.6vw;
    height: 0.6vw;
    background-color: white;
    border-radius: 50%;
  }
}

/* 右侧内容样式 */
.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1vw;
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
  width: 45%;
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
  gap: 2px;
  aspect-ratio: 1;
  background-color: white;
  padding: 2px;
}

.fan-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0px;
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
  border-radius: 0;
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
  width: calc(49.2%);
  padding: 0;
  background-color: transparent;
  margin-top: -1vw;
}

/* 标签页样式 */
.experiment-tabs {
  display: flex;
  gap: 3vw;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1vw;
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
    bottom: -0.1vw;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: #00A0E9;
    transition: all 0.3s ease;
    transform: translateX(-50%);
    opacity: 0;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -0.1vw;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: #00A0E9;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  &:hover::before {
    width: 100%;
    opacity: 1;
  }

  &.active {
    color: #00A0E9;
    
    &::after {
      width: 100%;
      opacity: 1;
    }
  }
}

/* 实验选择区域样式 */
.main-dropdown {
  width: 15.5vw;
  position: relative;
  
  .select-container {
    width: 100%;
    background: white;
    border-radius: 0.3vw;
    border: 1px solid #e0e0e0;
    padding: 0.8vw 1vw;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02);
      border-color: #00A0E9;
    }

    span {
      font-size: 0.9vw;
      color: #333;
    }

    .dropdown-arrow {
      transition: transform 0.3s ease;
      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .dropdown-options {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 0.3vw;
    margin-top: 0.5vw;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .dropdown-scroll {
    max-height: 6vw;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: #00A0E9;
      border-radius: 2px;
    }
  }

  .dropdown-option {
    padding: 0.8vw 1vw;
    font-size: 0.9vw;
    color: #333;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
      color: #00A0E9;
    }

    & + .dropdown-option {
      border-top: 1px solid #f0f0f0;
    }
  }
}

.experiment-select {
  width:26.5vw; // 添加这一行，使其与搜索框宽度一致
  margin-bottom: -0.5vw;
  margin-top: -0.5vw;
  position: relative;
  
  .select-label {
    color: #666;
    font-size: 0.9vw;
    margin-bottom: 0.5vw;
  }
  
  .select-container {
    width: 100%;
    background: white;
    border-radius: 0.3vw;
    border: 1px solid #e0e0e0;
    padding: 0.8vw 1vw;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02);
      border-color: #00A0E9;
    }

    span {
      font-size: 0.9vw;
      color: #333;
    }

    .dropdown-arrow {
      transition: transform 0.3s ease;
      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

.dropdown-options {
  position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 0.3vw;
    margin-top: 0.5vw;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

.dropdown-scroll {
  max-height: 6vw; // 设置最大高度
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #00A0E9;
    border-radius: 2px;
  }
}

.dropdown-option {
  padding: 0.8vw 1vw;
  font-size: 0.95vw;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f5;
    color: #00A0E9;
  }

  & + .dropdown-option {
    border-top: 1px solid #f0f0f0;
  }
}
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: scaleY(1);
}

/* 进度条样式 */
.progress-bar {
  width: calc(100%);
  height: 0.3vw;
  background-color: rgb(232, 232, 232);
  border-radius: 0.15vw;
  margin: 1.5vw 0vw ;
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
  width: calc(100%);
  gap: 1vw;
  position: relative;
  margin-top: -0.3vw;
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
/* 表格容器样式 */
.table-container {
  width: 49%;
  background: white;
  border-radius: 0.5vw;
  height: 28vh;
  overflow-y: auto;
  overflow-x: hidden;
  margin: -2.7vw -1.5vw 0vw -0.35vw;

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

/* 布局容器补充样式 */
.control-panel-container {
  display: flex;
  gap: 1.4vw;
  width: 100%;
}
/* 高级实验提示样式 */
.advanced-notice {
  padding: 0vw;
  margin-top: -0.5vw;

  .notice-text {
    color: #666;
    font-size: 0.9vw;
    
    &:last-of-type {
      margin-bottom: 1vw;
    }
  }

  .notice-buttons {
    display: flex;
    gap: 1vw;
    
    .notice-btn {
      width: 15.5vw;
      padding: 0.7vw 1vw;
      border: 1px solid #e0e0e0;
      border-radius: 0.3vw;
      background: white;
      color: #333;
      font-size: 0.9vw;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.02);
      }

      &.active {
        background: #00A0E9;
        color: white;
        border-color: #00A0E9;
      }
    }
  }
}
/* 回放界面样式 */
.playback-notice {
  padding: 0;
  margin-top: -0.5vw;

  .selected-track {
    color: #666;
    font-size: 0.9vw;
    margin-bottom: 1vw;
  }
  
  .track-info {
    .track-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5vw;

      .track-name {
        font-size: 0.9vw;
        color: #333;
      }

      .track-details {
        display: flex;
        gap: 2vw;
        color: #666;
        font-size: 0.9vw;
      }
    }
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
    width: 100%;
    gap: 1vw;
    position: relative;
    margin-top: 1vw;
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
}

.playback-notice {
  padding: 0;
  margin-top: -0.5vw;

  .notice-tip {
    color: #666;
    font-size: 0.9vw;
    margin-bottom: 1vw;
  }

  .notice-tip-active {
    color: #666;
    font-size: 0.9vw;
    margin-bottom: 0.5vw;
    margin-left: 0.5vw;
  }
  
  .track-info {
    margin:0vw -0.5vw 0vw;
    margin-bottom: -1.4vw;
    
    .track-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      padding: 0.8vw 1vw;
      border-radius: 0.3vw;

      .track-name {
        font-size: 0.9vw;
        color: #333;
      }

      .track-details {
        display: flex;
        gap: 2vw;
        color: #666;
        font-size: 0.9vw;
      }
    }
  }

  .playback-controls {
    margin-top: 1.5vw;
  }
}

.select-btn {
  width: 1.2vw;
  height: 1.2vw;
  background-color: #00A0E9;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  padding: 0;
  margin-right: 0.8vw;
  transition: all 0.3s ease;
  vertical-align: middle;

  &.selected::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0.6vw;
    height: 0.6vw;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: scale(1.1);
  }
}
</style>
