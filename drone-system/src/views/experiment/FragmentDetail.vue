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
      <div class="info-container">
        <div class="form-group">
          <label>片段名称</label>
          <input 
            type="text" 
            v-model="formData.title"
            placeholder="可变截面、强度标准湍流"
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
          <label>片段简介</label>
          <textarea 
            v-model="formData.description"
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
        <button class="btn btn-blue">
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
        <button class="btn btn-blue">
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

    <!-- 使用文档页面 -->
    <template v-if="currentTab === '使用文档'">
      <div class="doc-container">
        <div class="action-buttons">
          <button class="btn btn-blue" @click="handleDocUpload">
            <img src="@/assets/UI/上传白色.svg" alt="上传">
            <span>上传配置文件</span>
          </button>
          <button class="btn btn-blue">
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import fileService from '@/services/fileService';
//import projectService from '@/services/projectService';

export default {
  name: 'FragmentDetail',
  props: {
    type: {
      type: String,
      default: 'fragment-detail'  // 修改默认值
    }
  },
  setup() {
    const router = useRouter();
    const currentTab = ref('基本');
    const fragmentTabs = ['基本', '函数', '使用文档', '删除片段'];
    const uploadedWindFile = ref(null);
    const uploadedRainFile = ref(null);
    const runMode = ref('');
    
    const switchTab = (tab) => {
      currentTab.value = tab;
    };

    const formData = ref({
      title: '',
      creator: '',
      password: '',
      contact: '',
      description: ''
    });

    const handleWindUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          uploadedWindFile.value = file;
          
          try {
            const result = await fileService.uploadFragmentFile(file);
            console.log('风片段文件上传成功:', result);
          } catch (error) {
            console.error('文件上传失败:', error);
          }
        }
      };
      input.click();
    };

    const handleRainUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          uploadedRainFile.value = file;
          
          try {
            const result = await fileService.uploadFragmentFile(file);
            console.log('雨雾片段文件上传成功:', result);
          } catch (error) {
            console.error('文件上传失败:', error);
          }
        }
      };
      input.click();
    };

    const setRunMode = (mode) => {
      if (!uploadedWindFile.value) {
        alert('请先上传风片段配置文件');
        return;
      }
      runMode.value = mode;
    };

    const handleSave = async () => {
      console.log('保存片段');
    };

    const handleCancel = () => {
      router.push('/experiment/edit');
    };

    const handleDelete = () => {
      if (confirm('确定要删除该片段吗？此操作不可恢复！')) {
        router.push('/experiment/edit');
      }
    };

    return {
      currentTab,
      fragmentTabs,
      formData,
      uploadedWindFile,
      uploadedRainFile,
      runMode,
      handleWindUpload,
      handleRainUpload,
      setRunMode,
      handleSave,
      handleCancel,
      handleDelete,
      switchTab
    };
  }
};
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