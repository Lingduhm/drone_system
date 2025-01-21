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

    <!-- 动捕设置页面 -->
    <template v-if="currentTab === '动捕设置'">
  <div class="mocap-settings">
    <!-- 空容器 -->
    <div class="empty-container"></div>

    <!-- XYZ数据表格 -->
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
import { ref } from 'vue'
//import { useStore } from 'vuex'
import { marked } from 'marked'

export default {
  name: 'ExperimentSettings',
  
  setup() {
    const currentTab = ref('基本')
    const settingTabs = ['基本', '高级', '动捕设置', '使用文档', '删除项目']
    const uploadedFile = ref(null)
    const uploadedDoc = ref(null)
    const markdownContent = ref('')
    
    // 修正: xyzRecords 声明提前
    const xyzRecords = ref([
      { id: 1, time: '0.00', x: '0.00', y: '0.00', z: '0.00' },
      { id: 2, time: '0.01', x: '0.01', y: '0.01', z: '0.01' }
    ])

    const formData = ref({
      title: '',
      creator: '',
      password: '',
      contact: '',
      description: ''
    })

    const switchTab = (tab) => {
      currentTab.value = tab
    }

    const handleUpload = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          uploadedFile.value = file
        }
      }
      input.click()
    }

    const handleDocUpload = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          uploadedDoc.value = file
          const reader = new FileReader()
          reader.onload = (event) => {
            const markdown = event.target.result
            markdownContent.value = marked(markdown)
          }
          reader.readAsText(file)
        }
      }
      input.click()
    }

    const handleDelete = () => {
      if (confirm('确定要删除该项目吗？此操作不可恢复！')) {
        // 这里添加删除逻辑
      }
    }

    const handleSave = () => {
      // 添加保存逻辑
      console.log('保存设置')
    }

    const handleCancel = () => {
      // 添加取消逻辑
      console.log('取消设置')
    }

    return {
      currentTab,
      settingTabs,
      formData,
      uploadedFile,
      uploadedDoc,
      markdownContent,
      xyzRecords,
      switchTab,
      handleUpload,
      handleDocUpload,
      handleDelete,
      handleSave,
      handleCancel
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
</style>