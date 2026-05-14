<!-- src/views/template/TemplateDetail.vue -->
<template>
  <div class="template-detail">
    <!-- 顶部标签栏 -->
    <div class="template-header">
      <div class="experiment-tabs">
        <div
          v-for="tab in tabs"
          :key="tab"
          :class="['tab', { active: currentTab === tab }]"
          @click="switchTab(tab)"
        >
          {{ tab }}
        </div>
      </div>
    </div>

    <!-- 基本信息部分 -->
    <template v-if="currentTab === '基本'">
      <!-- 操作按钮 -->
      <div class="action-buttons basic-actions">
        <button class="btn btn-save" @click="handleSave">
          <img src="@/assets/UI/保存白色.svg" alt="保存">
          <span>保存</span>
        </button>
        <button class="btn btn-cancel" @click="handleCancel">
          <img src="@/assets/UI/删除白色.svg" alt="放弃修改">
          <span>放弃修改</span>
        </button>
      </div>

      <!-- 基本信息表单 -->
      <div class="info-container">
        <div class="form-group">
          <label>模板名称</label>
          <input 
            type="text" 
            v-model="templateData.title"
            placeholder="可变截面、强度标准湍流"
          >
        </div>

        <div class="form-group">
          <label>负责人</label>
          <input 
            type="text" 
            v-model="templateData.creator"
            placeholder="张三"
          >
        </div>

        <div class="form-group">
          <label>密码 <span class="password-hint">仅支持数字</span></label>
          <input 
            type="password" 
            v-model="templateData.password"
            placeholder="123456789"
          >
        </div>

        <div class="form-group">
          <label>联系电话</label>
          <input 
            type="tel" 
            v-model="templateData.contact"
            placeholder="18088888888"
          >
        </div>

        <div class="form-group">
          <label>风型简介</label>
          <textarea 
            v-model="templateData.description"
            placeholder="请输入风型简介..."
          ></textarea>
        </div>
      </div>
    </template>

    <!-- 函数页面 -->
    <template v-if="currentTab === '函数'">
  <div class="function-container">
    <!-- 文件上传和下载按钮 -->
    <div class="action-buttons">
      <button class="btn btn-blue" @click="handleConfigUpload">
        <img src="@/assets/UI/上传白色.svg" alt="上传">
        <span>上传配置文件</span>
      </button>
      <button class="btn btn-blue" @click="handleConfigDownload">
        <img src="@/assets/UI/下载白色.svg" alt="下载">
        <span>下载配置文件</span>
      </button>
    </div>

    <!-- 文件显示区域 -->
    <div v-if="uploadedConfig" class="file-display">
      <img src="@/assets/UI/文件蓝色.svg" class="file-icon">
      <span class="file-name">{{ uploadedConfig.name }}</span>
      <img src="@/assets/UI/确认蓝色.svg" class="check-icon">
    </div>
  </div>
</template>

    <!-- 使用文档页面 -->
    <div v-if="currentTab === '使用文档'" class="doc-container">
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

    <!-- 删除模板页面 -->
    <div v-if="currentTab === '删除模板'" class="delete-container">
      <button class="btn btn-danger" @click="handleDelete">
        <img src="@/assets/UI/删除.svg" alt="删除">
        <span>删除模板</span>
      </button>
      <p class="delete-warning">模板一旦删除，不可恢复！如非模板开发者本人，请致电咨询。</p>
    </div>
  </div>
</template>

<script>
// src/views/template/TemplateDetail.vue script部分
import { ref, onMounted } from 'vue';
//import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import templateService from '@/services/templateService';

export default {
 name: 'TemplateDetail',
 
 setup() {
   //const store = useStore();
   const route = useRoute();
   const router = useRouter();
   
   const templateId = route.params.id;
   const currentTab = ref('基本');
   const tabs = ['基本', '函数', '使用文档', '删除模板'];
   const uploadedConfig = ref(null);
   const uploadedDoc = ref(null);
   const markdownContent = ref('');

   // 模板信息的响应式变量
   const templateData = ref({
     title: '',
     creator: '',
     password: '',
     contact: '',
     description: '',
     type: ''
   });

   // 加载模板信息
   const loadTemplateInfo = async () => {
     try {
       const info = await templateService.getTemplateInfo(templateId);
       if (info) {
         templateData.value = info;
       }
     } catch (error) {
       console.error('获取模板信息失败:', error);
     }
   };

   // 获取文档方法
   const handleGetDocument = async () => {
     if (templateId) {
       try {
         const doc = await templateService.getTemplateDocument(templateId);
         if (doc && doc.content) {
           markdownContent.value = marked(doc.content);
           uploadedDoc.value = { name: doc.filename };
         }
       } catch (error) {
         console.error('获取文档失败:', error);
       }
     }
   };

   // 获取配置文件方法
   const handleGetConfig = async () => {
  if (templateId) {
    try {
      const config = await templateService.getTemplateConfig(templateId);
      if (config && config.originalName) {
        uploadedConfig.value = {
          name: config.originalName
        };
      }
    } catch (error) {
      console.error('获取配置文件失败:', error);
      uploadedConfig.value = null;
    }
  }
};

   // 切换标签页
   const switchTab = (tab) => {
     currentTab.value = tab;
     if (tab === '使用文档') {
       handleGetDocument();
     } else if (tab === '函数') {
       handleGetConfig();
     }
   };

   // 文档上传处理
   const handleDocUpload = async () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = '.md';
     input.onchange = async (e) => {
       const file = e.target.files[0];
       if (file) {
         try {
           uploadedDoc.value = file;
           const reader = new FileReader();
           reader.onload = async (event) => {
             await templateService.uploadTemplateDocument(templateId, file);
             markdownContent.value = marked(event.target.result);
           };
           reader.readAsText(file);
         } catch (error) {
           console.error('文档上传失败:', error);
           alert('上传失败，请重试');
           uploadedDoc.value = null;
           markdownContent.value = '';
         }
       }
     };
     input.click();
   };

   // 文档下载处理
   const handleDocDownload = async () => {
     if (!uploadedDoc.value) {
       alert('没有可下载的文档');
       return;
     }

     try {
       await templateService.downloadTemplateDocument(templateId);
     } catch (error) {
       console.error('下载文档失败:', error);
       alert('下载失败，请重试');
     }
   };

   // 配置文件上传处理
const handleConfigUpload = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js,.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const result = await templateService.uploadTemplateConfig(templateId, file);
        if (result.success) {
          uploadedConfig.value = {
            name: file.name,  // 显示原始文件名
            systemName: result.filename  // 保存系统文件名用于下载
          };
        }
      } catch (error) {
        console.error('配置文件上传失败:', error);
        alert('上传失败，请重试');
        uploadedConfig.value = null;
      }
    }
  };
  input.click();
};


   // 配置文件下载处理
   const handleConfigDownload = async () => {
     if (!uploadedConfig.value) {
       alert('没有可下载的配置文件');
       return;
     }

     try {
       await templateService.downloadTemplateConfig(templateId);
     } catch (error) {
       console.error('下载配置文件失败:', error);
       alert('下载失败，请重试');
     }
   };

   const handleSave = async () => {
      try {
        await templateService.updateTemplateInfo(templateId, templateData.value);
        alert('保存成功');
      } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试');
      }
    };

   const handleCancel = () => {
     router.push('/template');
   };

   const handleDelete = async () => {
  if (confirm('确定要删除该模板吗？此操作不可恢复！')) {
    try {
      const templateId = route.params.id;
      await templateService.deleteTemplate(templateId);
      // 删除成功后跳转到模板列表页面
      router.push('/template');
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除失败，请重试');
    }
  }
};

   onMounted(async () => {
     // 加载模板信息
     await loadTemplateInfo();
     
     // 根据当前标签页加载相应内容
     if (currentTab.value === '使用文档') {
       handleGetDocument();
     } else if (currentTab.value === '函数') {
       handleGetConfig();
     }
   });

   return {
     currentTab,
     tabs,
     templateData,
     uploadedConfig,
     uploadedDoc,
     markdownContent,
     switchTab,
     handleDocUpload,
     handleDocDownload,
     handleConfigUpload,
     handleConfigDownload,
     handleSave,
     handleCancel,
     handleDelete
   };
 }
};
</script>

<style lang="scss" scoped>
.template-detail {
  padding: 1vw;
}

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

// 基本页面样式
.basic-actions {
  width: 35vw;
  margin: 1vw -1vw;
  display: flex;
  gap: 1vw;

  .btn {
    width: 17vw;
  }
}

.info-container {
  width: 35vw;
  background-color: white;
  padding: 1.5vw;
  border-radius: 0.5vw;
  margin-left: -1vw;
}

.form-group {
  margin-bottom: 1.5vw;

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

// 通用按钮样式
.btn {
  padding: 0.7vw 1vw;
  border: none;
  border-radius: 0.3vw;
  cursor: pointer;
  font-size: 0.9vw;
  color: white;
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 1vw;
  transition: transform 0.3s;

  img {
    width: 1.3vw;
    height: 1.3vw;
  }

  &:hover {
    transform: scale(1.02);
  }

  &-save {
    background-color: #00A0E9;
  }

  &-cancel {
    background-color: #e40041;
  }

  &-blue {
    background-color: #00A0E9;
  }

  &-danger {
    background-color: #e40041;
  }
}

// 函数和文档页面样式
.function-container,
.doc-container {
  .action-buttons {
    display: flex;
    gap: 1vw;
    margin-bottom: 1vw;
    margin-left: -1vw;

    .btn {
      width: 15.5vw;
    }
  }

  .file-display {
    background: (242,242,242);
    border-radius: 0.3vw;
    padding: 0.8vw;
    display: flex;
    align-items: center;
    margin: 1vw -1vw -0.5vw;
    width: 32vw;
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
}

// Markdown预览容器样式
.markdown-preview {
  width: 32vw;
  height: calc(100vh - 18vw);
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

// 删除模板页面样式
.delete-container {
  .btn-danger {
    width: 31vw;
    margin-bottom: 1vw;
    margin-left: -1vw;
    width: 18vw;
    
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
</style>