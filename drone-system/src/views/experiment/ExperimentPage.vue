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
          <button class="btn btn-blue" @click="handleRename"
          :disabled="selectedRecords.length !== 1">
            <img src="@/assets/UI/保存白色.svg" alt="重命名">
            <span>重命名</span>
          </button>
          <button class="btn btn-red"   @click="handleDelete"
          :disabled="selectedRecords.length === 0">
            <img src="@/assets/UI/删除.svg" alt="删除记录">
            <span>删除记录</span>
          </button>
        </div>
        <div class="action-buttons-row">
          <button class="btn btn-blue"   @click="handleDownload"
          :disabled="selectedRecords.length === 0">
            <img src="@/assets/UI/下载白色.svg" alt="实验记录下载">
            <span>实验记录下载</span>
          </button>
          <button class="btn btn-blue"   @click="handleBatchDownload"
          :disabled="!records.length">
            <img src="@/assets/UI/下载白色.svg" alt="所有记录打包下载">
            <span>所有记录打包下载</span>
          </button>
        </div>
      </div>

<!-- 记录列表 -->
<div class="records-container">
  <table class="records-table" v-if="currentFragment">
    <thead>
      <tr>
        <th></th>
        <th>记录名称</th>
        <th>实验时长</th>
        <th>实验时间</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="record in filteredRecords" :key="record.name">
        <td>
          <button 
            class="select-btn" 
            :class="{ selected: record.selected }"
            @click="handleSelect(record)"
          ></button>
        </td>
        <td>{{ record.name }}</td>
        <td>{{ formatDuration(record.duration) }}</td>
        <td>{{ formatTime(record.time) }}</td>
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
                :style="getFanStyle(group - 1, fan - 1)"
              ></div>
            </div>
          </div>
        </div>

        <!-- 空白容器 -->
<div class="empty-container">
  <ThreeScene 
    :is-playing="isPlaying"
    :is-paused="isPaused"
    @update-coordinates="handleCoordinateUpdate"
  />
</div>
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
          @click="handleTabClick(tab)"
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
                <span>{{ formatRecordDuration(selectedRecordForPlayback.duration) }}</span>
                <span>{{ formatRecordTime(selectedRecordForPlayback.time) }}</span>
              </div>
            </div>
          </div>

          <!-- 播放控件 -->
          <div class="playback-controls">
            <!-- 进度条 -->
            <div class="progress-bar">
              <div 
                class="progress" 
                :style="{ width: `${playbackProgress}%` }"
              ></div>
              <div 
                class="progress-handle" 
                :style="{ left: `${playbackProgress}%` }"
              ></div>
            </div>
            <!-- 进度文本 -->
            <div class="progress-text">{{ currentTime }} / {{ totalTime }}</div>
            <!-- 控制按钮组 -->
<div class="control-buttons">
  <button class="control-btn terminal-btn" @click="openTerminal">
    <img src="@/assets/UI/终端白色.svg" alt="Record">
  </button>
  <div class="playback-buttons">
    <button class="control-btn" @click="togglePlayback">
      <!-- 根据播放状态显示不同图标 -->
      <div v-if="!isPlaying || (isPlaying && isPaused)" class="play-icon"></div>
      <div v-else class="pause-icon">
        <div class="pause-line"></div>
        <div class="pause-line"></div>
      </div>
    </button>
    <button class="control-btn" @click="stopPlayback" :disabled="!isPlaying">
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
          <div 
            class="progress" 
            :style="{ width: `${playbackProgress}%` }"
          ></div>
          <div 
            class="progress-handle" 
            :style="{ left: `${playbackProgress}%` }"
          ></div>
        </div>

        <!-- 进度文本 -->
        <div class="progress-text">{{ currentTime }} / {{ totalTime }}</div>

        <!-- 控制按钮组 -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import projectService from '@/services/projectService'
import fragmentService from '@/services/fragmentService'
import ThreeScene from '@/components/ThreeScene.vue'

export default {
  name: 'ExperimentPage',

  components: {
    ThreeScene
  },
  
  setup() {
    const store = useStore()
    const route = useRoute()
    const searchQuery = ref('')
    const selectedFragment = ref('')
    const currentTab = ref('实验记录')
    const controlDropdownOpen = ref(false)
    const controlSelectedFragment = ref('')
    const isLoading = ref(false)
    const currentFragment = ref(null)
    const records = ref([])
    const xyzRecords = ref([]); 

    // 标签页选项
    const tabs = ['实验记录', '高级实验', '回放']

    // 存储片段数据 
    const fragments = ref([])
    const dropdownOpen = ref(false)
    const selectedFragmentLabel = ref('')

    // 获取记录数据的方法
    const getRecords = async (fragmentId) => {
    try {
        if (!fragmentId) {
            console.log('No fragment ID provided');
            return;
        }
        const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
        if (!projectId) {
            console.log('No project ID found');
            return;
        }

        // 添加调试日志
        console.log('Fetching records for fragment:', fragmentId, 'project:', projectId);

        const response = await fetch(
            `http://${window.location.hostname}:3000/api/records/${fragmentId}?projectId=${projectId}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // 对记录进行排序
        records.value = data
            .map(record => ({
                ...record,
                selected: false,
                isTrack: /^track-\d+$/.test(record.name)
            }))
            .sort((a, b) => {
                // 自定义命名的记录放在最上面
                if (!a.isTrack && b.isTrack) return -1;
                if (a.isTrack && !b.isTrack) return 1;
                if (!a.isTrack && !b.isTrack) return 0;
                
                // track-n 按数字大小排序
                const numA = parseInt(a.name.split('-')[1]);
                const numB = parseInt(b.name.split('-')[1]);
                return numA - numB;
            });
        
        // 更新片段名称
        const selectedFragment = fragments.value.find(f => f.id === fragmentId);
        if (selectedFragment) {
            selectedFragmentLabel.value = selectedFragment.title;
        }
    } catch (error) {
        console.error('获取记录列表失败:', error);
        records.value = [];
    }
};
    // 获取片段列表
    const fetchFragments = async () => {
        const projectId = route.query.projectId || localStorage.getItem('currentProjectId')
        if (!projectId) {
            console.error('未找到项目ID')
            return
        }

        try {
            const response = await projectService.getProjectFragments(projectId)
            if (Array.isArray(response)) {
                fragments.value = response
                // 如果有片段，默认选中第一个并加载其PWM数据
                if (response.length > 0) {
                    selectedFragmentLabel.value = response[0].title
                    controlSelectedFragment.value = response[0].id
                    currentFragment.value = response[0]
                    // 设置选中片段
                    await store.dispatch('experiments/setSelectedFragment', {
                        ...response[0],
                        projectId
                    });
                    await loadFragmentPWM(response[0].id)
                    await getRecords(response[0].id)
                }
            }
        } catch (error) {
            console.error('获取片段列表失败:', error)
        }
    }

    // 获取 PWM 数据的方法
const loadFragmentPWM = async (fragmentId) => {
    try {
        isLoading.value = true;
        const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
        if (!projectId) {
            throw new Error('Project ID not found');
        }

        console.log('Loading PWM data for fragment:', fragmentId, 'project:', projectId);
        
        const result = await fragmentService.getPWMData(fragmentId);
        
        if (result.success && result.processedFile) {
            if (store.state.experimentPlayback.ws) {
                store.state.experimentPlayback.ws.send(JSON.stringify({
                    type: 'INITIALIZE',
                    projectId,
                    fragmentId,
                    filename: result.processedFile
                }));
            }
        } else {
            throw new Error(result.message || 'Failed to get PWM data');
        }
    } catch (error) {
        console.error('Failed to load PWM data:', error);
        throw error;
    } finally {
        isLoading.value = false;
    }
};
    // 生成选项
    const fragmentOptions = computed(() => {
        return fragments.value.map(fragment => ({
            value: fragment.id,
            label: fragment.title
        }))
    })

    const controlFragmentOptions = computed(() => {
        return fragmentOptions.value
    })

    // 播放控制相关计算属性
    const isPlaying = computed(() => store.state.experimentPlayback.isPlaying)
    const isPaused = computed(() => store.state.experimentPlayback.isPaused)
    const playbackProgress = computed(() => store.getters['experimentPlayback/playbackProgress'])
    const currentTime = computed(() => store.getters['experimentPlayback/currentTime'])
    const totalTime = computed(() => store.getters['experimentPlayback/totalTime'])
    const matrixColors = computed(() => store.getters['experimentPlayback/matrixColors'])
    // 选中的记录
    const selectedRecord = computed(() => {
        return records.value ? records.value.find(record => record.selected) : null
    })

    const selectedRecordForPlayback = computed(() => {
        if (currentTab.value !== '回放') return null
        return records.value.find(record => record.selected)
    })

    // 过滤记录
    const filteredRecords = computed(() => {
  if (!searchQuery.value) return records.value;
  
  const query = searchQuery.value.toLowerCase();
  return records.value.filter(record => {
    // 搜索名称
    const nameMatch = record.name.toLowerCase().includes(query);
    // 搜索时长
    const durationMatch = record.duration.toLowerCase().includes(query);
    // 搜索时间
    const timeMatch = record.time.toLowerCase().includes(query);
    
    return nameMatch || durationMatch || timeMatch;
  });
});

    // 下拉框控制
const toggleDropdown = () => {
  // 只在实验正在进行时禁用展开选项
  if (isPlaying.value){
         return;
    }
  dropdownOpen.value = !dropdownOpen.value;
};

    const toggleControlDropdown = () => {
      if (isPlaying.value) {
        return;
    }
        controlDropdownOpen.value = !controlDropdownOpen.value
    }

const selectFragment = async (value) => {
    console.log('Selecting fragment for record list:', value);
    const selected = fragments.value.find(f => f.id === value);
    if (selected) {
        // 更新左侧记录列表相关的状态
        selectedFragmentLabel.value = selected.title;
        selectedFragment.value = value;
        currentFragment.value = selected;

        // 清除所有记录的选中状态
        records.value.forEach(r => r.selected = false);

        // 获取新片段的记录列表
        await getRecords(value);
        
        // 如果不是在回放模式，也更新播放器控制的片段
        if (currentTab.value !== '回放') {
            controlSelectedFragment.value = value;
            await store.dispatch('experiments/setSelectedFragment', {
                ...selected,
                projectId: route.query.projectId
            });
            await loadFragmentPWM(value);
        }
    }
    dropdownOpen.value = false;
};

    // 选择片段的处理方法
// ExperimentPage.vue
const selectControlFragment = async (value) => {
   // 只要实验正在进行（包括暂停状态），都不允许切换片段
   if (isPlaying.value) {
        return;
    }
    console.log('Selecting fragment for playback control:', value);
    const selected = fragments.value.find(f => f.id === value);
    if (selected) {
        controlSelectedFragment.value = value;
        
        if (currentTab.value !== '回放') {
            // 实验记录模式：更新当前片段和加载PWM数据
            currentFragment.value = selected;
            await store.dispatch('experiments/setSelectedFragment', {
                ...selected,
                projectId: route.query.projectId
            });
            await loadFragmentPWM(value);
        }
    }
    controlDropdownOpen.value = false;
};

    // 控制按钮方法
    const togglePlayback = async () => {
  if (currentTab.value === '实验记录') {
    // 保持原有实验记录模式的逻辑不变
    if (!currentFragment.value) {
      alert('请先选择片段');
      return;
    }

    if (!isPlaying.value) {
      xyzRecords.value = [];
      await store.dispatch('experimentPlayback/startPlayback');
    } else if (isPaused.value) {
      await store.dispatch('experimentPlayback/resumePlayback');
    } else {
      await store.dispatch('experimentPlayback/pausePlayback');
    }
  } else if (currentTab.value === '回放') {
    // 回放模式新逻辑
    if (!selectedRecordForPlayback.value) {
      alert('请选择要回放的记录');
      return;
    }

    if (!isPlaying.value) {
      // 开始回放前清空坐标记录
      xyzRecords.value = [];
      // 使用专门的回放开始动作
      await store.dispatch('experimentPlayback/startRecordPlayback', {
        recordName: selectedRecordForPlayback.value.name,
        fragmentId: selectedFragment.value,
        projectId: route.query.projectId
      });
    } else if (isPaused.value) {
      await store.dispatch('experimentPlayback/resumeRecordPlayback');
    } else {
      await store.dispatch('experimentPlayback/pauseRecordPlayback');
    }
  }
};

const stopPlayback = async () => {
  // 立即清空 XYZ 坐标表格数据
  xyzRecords.value = [];
  
  // 调用 store action 停止播放并清理状态
  await store.dispatch('experimentPlayback/stopPlayback');
};

// 添加重命名等操作方法
const handleRename = async () => {
  if (selectedRecords.value.length !== 1) {
    alert('请选择一条记录进行重命名');
    return;
  }
  
  const record = selectedRecords.value[0];
  const newName = prompt('请输入新的记录名称（最多12个汉字或24个英文字符）:', record.name);
  
  if (!newName || newName === record.name) return;

  // 验证新名称
  const validation = validateRecordName(newName);
  if (!validation.valid) {
    alert(validation.message);
    return;
  }

  try {
    const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
    const fragmentId = currentFragment.value?.id;
    
    const response = await fetch(`http://${window.location.hostname}:3000/api/records/${fragmentId}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        recordName: record.name,
        newName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '重命名失败');
    }

    await getRecords(fragmentId); // 重新加载记录
  } catch (error) {
    console.error('重命名失败:', error);
    alert(error.message || '重命名失败，请重试');
  }
};

const handleDelete = async () => {
  const selected = selectedRecords.value;
  if (selected.length === 0) {
    alert('请至少选择一条记录');
    return;
  }

  if (!confirm(`确定要删除选中的 ${selected.length} 条记录吗？`)) return;

  try {
    const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
    const fragmentId = currentFragment.value?.id;
    
    const response = await fetch(`http://${window.location.hostname}:3000/api/records/${fragmentId}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        recordNames: selected.map(r => r.name)
      })
    });

    if (response.ok) {
      await getRecords(fragmentId); // 重新加载记录
    } else {
      throw new Error('删除失败');
    }
  } catch (error) {
    console.error('删除记录失败:', error);
    alert('删除失败，请重试');
  }
};

const handleDownload = async () => {
  const selected = selectedRecords.value;
  if (selected.length === 0) {
    alert('请至少选择一条记录');
    return;
  }

  try {
    const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
    const fragmentId = currentFragment.value?.id;
    
    if (selected.length === 1) {
      // 单文件下载
      const response = await fetch(
        `http://${window.location.hostname}:3000/api/records/${fragmentId}/download/${selected[0].name}?projectId=${projectId}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('下载失败');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selected[0].name}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // 多文件打包下载
      const response = await fetch(`http://${window.location.hostname}:3000/api/records/${fragmentId}/batch-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          recordNames: selected.map(r => r.name) 
        })
      });

      if (!response.ok) throw new Error('打包下载失败');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected_records_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('下载失败:', error);
    alert('下载失败，请重试');
  }
};

const handleBatchDownload = async () => {
  try {
    const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
    const fragmentId = currentFragment.value?.id;
    
    // 使用所有记录的名称，而不是选中的记录
    const recordNames = records.value.map(r => r.name);

    const response = await fetch(`http://${window.location.hostname}:3000/api/records/${fragmentId}/batch-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, recordNames })
    });

    if (!response.ok) throw new Error('打包下载失败');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_records_${new Date().getTime()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('打包下载失败:', error);
    alert('打包下载失败，请重试');
  }
};

    const handleClose = () => {
        console.log('关闭高级实验')
    }

    const handleStart = () => {
        console.log('开启高级实验')
    }

const handleSelect = async (record) => {
  if (currentTab.value === '回放') {
    // 如果正在播放，先停止
    if (isPlaying.value) {
      await store.dispatch('experimentPlayback/stopPlayback');
    }

    // 取消选择时清除播放数据
    if (record.selected) {
      record.selected = false;
      store.commit('experimentPlayback/CLEAR_PLAYBACK_DATA');
      store.commit('experimentPlayback/SET_TOTAL_FRAMES', 0);
      store.commit('experimentPlayback/SET_DURATION', 0);
      return;
    }

    // 在回放模式下，取消所有记录的选中状态，只选中当前记录
    records.value.forEach(r => {
      r.selected = r.name === record.name;
    });

    // 如果选中了记录，使用当前记录列表的片段ID加载数据
    if (record.selected && selectedFragment.value) {
      try {
        const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
        await loadRecordPWMData(selectedFragment.value, record.name, projectId);
      } catch (error) {
        console.error('Failed to load record:', error);
        record.selected = false;
        store.commit('experimentPlayback/CLEAR_PLAYBACK_DATA');
        store.commit('experimentPlayback/SET_TOTAL_FRAMES', 0);
        store.commit('experimentPlayback/SET_DURATION', 0);
      }
    }
  } else {
    record.selected = !record.selected;
  }
};

const loadRecordPWMData = async (fragmentId, recordName, projectId) => {
  try {
    console.log('Loading record PWM data:', {
      fragmentId,
      recordName,
      projectId
    });

    // 首先获取回放相关的元数据
    const response = await fetch(
      `http://${window.location.hostname}:3000/api/records/${fragmentId}/pwm/${recordName}?projectId=${projectId}`
    );

    if (!response.ok) {
      throw new Error('Failed to load record PWM data');
    }

    const data = await response.json();
    if (data.success) {
      // 设置回放模式
      store.commit('experimentPlayback/SET_PLAYBACK_MODE', true);
      
      // 初始化回放模式的 WebSocket 连接
      await store.dispatch('experimentPlayback/connectWebSocket', {
        projectId,
        fragmentId,
        mode: 'playback',
        recordName
      });
    } else {
      throw new Error(data.message || 'Failed to load record data');
    }
  } catch (error) {
    console.error('加载记录PWM数据失败:', error);
    throw error;
  }
};

const canPlay = computed(() => {
  // 在实验记录模式下，只要有片段就可以播放
  if (currentTab.value === '实验记录') {
    return currentFragment.value !== null;
  }
  // 在回放模式下，需要选中记录才能播放
  return selectedRecordForPlayback.value !== null;
});

    const getFanStyle = (groupIndex, fanIndex) => {
        if (!matrixColors.value) {
            return { backgroundColor: 'rgb(232, 232, 232)' }
        }

        const rowGroup = Math.floor(groupIndex / 12)
        const colGroup = groupIndex % 12
        const subRow = Math.floor(fanIndex / 3)
        const subCol = fanIndex % 3
        const row = rowGroup * 3 + subRow
        const col = colGroup * 3 + subCol
        
        return {
            backgroundColor: matrixColors.value[row][col]
        }
    }

    const openTerminal = () => {
    try {
        const terminalWindow = window.open('/terminal.html', '_blank')
        if (terminalWindow) {
            // 发送初始化消息到终端
            store.commit('experimentPlayback/SET_TERMINAL_WINDOW', true)
            
            // 使用定时器检查终端标签页是否关闭
            const checkInterval = setInterval(() => {
                if (terminalWindow.closed) {
                    clearInterval(checkInterval)
                    store.commit('experimentPlayback/SET_TERMINAL_WINDOW', false)
                }
            }, 1000)
        } else {
            alert('弹窗被浏览器阻止,请允许弹窗后重试')
        }
    } catch (error) {
        console.error('打开终端窗口失败:', error)
    }
}
    
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '';
    
    // 返回格式: YYYY-MM-DD HH:mm:ss
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit', 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Time formatting error:', error);
    return '';
  }
};

    const formatDuration = (duration) => {
        // 移除's'后缀并转换为数字
        const seconds = parseFloat(duration.replace('s', ''));
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 100); // 获取毫秒部分

        // 格式化输出为 00:00.00
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }

    const selectedRecords = computed(() => {
        return records.value.filter(record => record.selected);
    })

    // 添加名称验证函数
const validateRecordName = (name) => {
  // 计算字符串长度（一个汉字算2个长度）
  const getStringLength = (str) => {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      // 使用正则判断是否为汉字
      length += /[\u4e00-\u9fa5]/.test(str[i]) ? 2 : 1;
    }
    return length;
  };

  // 检查是否包含非法字符
  if (/[<>:"/\\|?*]/.test(name)) {
    return {
      valid: false,
      message: '名称不能包含特殊字符 < > : " / \\ | ? *'
    };
  }

  const length = getStringLength(name);
  if (length > 24) {
    return {
      valid: false,
      message: '名称过长（最多12个汉字或24个英文字符）'
    };
  }

  return { valid: true };
};

const handleCoordinateUpdate = (coords) => {
  // 更新 XYZ 数据表格
  if (!xyzRecords.value) {
    xyzRecords.value = [];
  }

  // 创建新记录
  const newRecord = {
    id: Date.now(), // 添加唯一ID
    time: coords.time || currentTime.value, // 使用当前播放时间如果没有提供时间
    x: coords.x,
    y: coords.y,
    z: coords.z
  };

  // 更新记录到表格
  xyzRecords.value.unshift(newRecord);
    
  // 保持最多200条记录
  if (xyzRecords.value.length > 200) {
    xyzRecords.value.pop();
  }

  // 更新 experimentPlayback store 中的坐标
  store.commit('experimentPlayback/UPDATE_COORDINATES', {
    x: coords.x,
    y: coords.y,
    z: coords.z
  });
};

  // 监听记录完成并刷新列表
  const handleRecordCompleted = async (fragmentId) => {
    if (fragmentId === currentFragment.value?.id) {
      await getRecords(fragmentId);
    }
  };

  const formatRecordTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '';
    
    // 格式化为 YYYY/MM/DD HH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('时间格式化错误:', error);
    return '';
  }
};

const formatRecordDuration = (duration) => {
  if (!duration) return '00:00.00';
  
  const totalSeconds = parseFloat(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 100);
  
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
};

const isTabDisabled = (tab) => {
      if (isPlaying.value || isPaused.value) {
        if (currentTab.value === '实验记录') {
          return tab !== '实验记录';
        }
        if (currentTab.value === '回放') {
          return tab !== '回放';
        }
      }
      return false;
    };

    // 处理标签页点击
    const handleTabClick = (tab) => {
      if (isTabDisabled(tab)) {
        return;
      }
      currentTab.value = tab;
    };

// 在模板中使用
const selectedRecordDetails = computed(() => {
  if (!selectedRecordForPlayback.value) return null;
  
  return {
    name: selectedRecordForPlayback.value.name,
    duration: formatRecordDuration(selectedRecordForPlayback.value.duration),
    time: formatRecordTime(selectedRecordForPlayback.value.time)
  };
});

    // 监听路由变化
    watch(
        () => route.fullPath,
        async () => {
            const currentFragment = store.state.experiments.selectedFragment;
            if (currentFragment) {
            await getRecords(currentFragment.id);
            }
        }
    )

// 监听标签页变化
watch(
  () => currentTab.value,
  async (newTab, oldTab) => {
    // 如果正在播放则停止
    if (isPlaying.value) {
      await store.dispatch('experimentPlayback/stopPlayback');
    }
    
    // 清除选中状态
    records.value.forEach(r => r.selected = false);
    
    // 设置播放模式
    store.commit('experimentPlayback/SET_PLAYBACK_MODE', newTab === '回放');

    // 从回放模式切换出来时的特殊处理
    if (oldTab === '回放') {
      // 关闭并清理 WebSocket 连接
      if (store.state.experimentPlayback.ws) {
        store.state.experimentPlayback.ws.close();
        store.commit('experimentPlayback/SET_WEBSOCKET', null);
      }
      
      // 重置所有状态
      store.commit('experimentPlayback/CLEAR_PLAYBACK_DATA');
      store.commit('experimentPlayback/SET_TOTAL_FRAMES', 0);
      store.commit('experimentPlayback/SET_DURATION', 0);
      store.commit('experimentPlayback/SET_RECORD_METADATA', null);

      // 如果有当前片段，重新初始化连接
      if (currentFragment.value) {
        try {
          // 延迟一小段时间确保旧连接完全关闭
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 重新建立实验模式的连接
          await store.dispatch('experimentPlayback/connectWebSocket', {
            projectId: currentFragment.value.projectId,
            fragmentId: currentFragment.value.id
          });

          // 重新加载 PWM 数据
          await loadFragmentPWM(currentFragment.value.id);
        } catch (error) {
          console.error('Failed to reinitialize experiment connection:', error);
        }
      }
    }
    
    // 切换到回放模式时的处理
    if (newTab === '回放') {
      if (store.state.experimentPlayback.ws) {
        store.state.experimentPlayback.ws.close();
      }
      // 初始化为0
      store.commit('experimentPlayback/SET_TOTAL_FRAMES', 0);
      store.commit('experimentPlayback/SET_DURATION', 0);
    }
  }
);

// 添加对 selectedFragment 的监听，切换片段时也清除播放数据
watch(
    () => selectedFragment.value,
    () => {
        if (currentTab.value === '回放') {
            store.commit('experimentPlayback/CLEAR_PLAYBACK_DATA');
            records.value.forEach(r => r.selected = false);
        }
    }
);

    // 监听记录状态变化
    watch(
        () => store.state.experimentPlayback.isRecording,
        async (newValue, oldValue) => {
            if (!newValue && oldValue) {
                // 记录结束时刷新列表
                if (currentFragment.value) {
                    await getRecords(currentFragment.value.id)
                }
            }
        }
    )

    // 监听片段选择变化
    watch(
    () => store.state.experiments.selectedFragment,
    async (newFragment) => {
        console.log('Selected fragment changed:', newFragment);
        if (currentTab.value === '回放') {
            // 在回放模式下，当片段改变时清除所有记录的选中状态
            records.value.forEach(r => r.selected = false);
            
            // 清除当前回放状态
            await store.dispatch('experimentPlayback/stopPlayback');
            store.commit('experimentPlayback/CLEAR_PLAYBACK_DATA');
        }
    }
);

const handleCoordinateUpdateEvent = (event) => {
  if (event && event.detail) {
    handleCoordinateUpdate(event.detail);
  }
};

    // 组件卸载时清理
    onUnmounted(() => {
        // 移除坐标更新事件监听
        window.removeEventListener('xyz-coordinates-update', handleCoordinateUpdateEvent);
        
        store.state.experimentPlayback.recordCompletedCallback = null;
        store.commit('experimentPlayback/SET_TERMINAL_WINDOW', false);
        store.commit('experiments/SET_SELECTED_FRAGMENT', null);
        store.dispatch('experimentPlayback/stopPlayback');
        store.commit('experimentPlayback/CLEAR_ALL_STATES');
        store.commit('experimentPlayback/SET_PLAYBACK_MODE', false);
        store.commit('experimentPlayback/SET_RECORD_METADATA', null);
    })

    // 组件挂载时初始化
    onMounted(async () => {
      console.log('Component mounted');

      // 添加坐标更新事件监听
      window.addEventListener('xyz-coordinates-update', handleCoordinateUpdateEvent);

      // 初始化 xyzRecords 数组
      xyzRecords.value = [];

      await fetchFragments();
      const selectedFragment = store.state.experiments.selectedFragment;
      if (selectedFragment) {
        console.log('Loading initial fragment:', selectedFragment.id);
        await getRecords(selectedFragment.id);
        
        try {
          // 设置记录完成的回调
          store.state.experimentPlayback.recordCompletedCallback = handleRecordCompleted;

          // 连接 WebSocket
          await store.dispatch('experimentPlayback/connectWebSocket', {
            projectId: selectedFragment.projectId,
            fragmentId: selectedFragment.id
          });

          // 加载 PWM 数据
          await loadFragmentPWM(selectedFragment.id);
        } catch (error) {
          console.error('Failed to initialize playback:', error);
        }
      }
    });

    return {
        searchQuery,
        selectedFragment,
        currentTab,
        tabs,
        controlDropdownOpen,
        controlSelectedFragment,
        currentFragment,
        isLoading,
        controlSelectedFragmentLabel: computed(() => {
            const option = controlFragmentOptions.value.find(opt => opt.value === controlSelectedFragment.value)
            return option ? option.label : '请选择片段'
        }),
        controlFragmentOptions,
        records,
        xyzRecords,
        filteredRecords,
        selectedRecord,
        isPlaying,
        isPaused,
        playbackProgress,
        currentTime,
        totalTime,
        matrixColors,
        toggleControlDropdown,
        selectControlFragment,
        togglePlayback,
        stopPlayback,
        handleClose,
        handleStart,
        handleSelect,
        selectedRecordForPlayback,
        dropdownOpen,
        selectedFragmentLabel,
        fragmentOptions,
        toggleDropdown,
        selectFragment,
        getFanStyle,
        openTerminal,
        formatTime,
        formatDuration,
        selectedRecords,
        handleRename,
        handleDelete,
        handleDownload,
        handleBatchDownload,
        validateRecordName,
        canPlay,
        handleCoordinateUpdate,
        handleCoordinateUpdateEvent,
        loadRecordPWMData,
        formatRecordTime,
        formatRecordDuration,
        selectedRecordDetails,
        handleTabClick
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      transform: none;
    }
  }

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
  overflow: hidden;
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