<template>
  <div class="template-page">
    <!-- 标签栏 - 保持不变 -->
    <div class="template-header">
      <div class="experiment-tabs">
        <div
          v-for="type in templateTypes"
          :key="type"
          :class="['tab', { active: currentType === type }]"
          @click="switchType(type)"
        >
          {{ type }}
        </div>
      </div>
    </div>

    <!-- 操作栏 - 保持不变 -->
    <div class="action-bar">
      <div class="action-container new-project-container" @click="$router.push('/template/new')">
        <img src="@/assets/UI/新建白色.svg" alt="新建" class="new-project-icon">
        <span class="new-project-text">新建</span>
      </div>

      <div class="action-container search-container">
        <input 
          type="text" 
          class="search-input" 
          v-model="searchQuery" 
        >
        <img src="@/assets/UI/搜索蓝色.svg" alt="搜索" class="search-icon">
      </div>
    </div>

    <!-- 模板网格 - 保持不变 -->
    <div class="project-grid">
      <div 
        v-for="template in filteredTemplates" 
        :key="template.id" 
        class="project-card"
      >
        <div class="project-header">
          <span>{{ template.date }}</span>
          <span>{{ template.id }}</span>
        </div>
        <div class="project-title">{{ template.title }}</div>
        <div class="project-footer">
          <div class="creator">创建人 {{ template.creator }}</div>
          <div class="action-buttons">
            <button class="action-btn" @click="viewTemplate(template)">
              <img src="@/assets/UI/关于白色24.svg" alt="查看">
            </button>
            <button class="action-btn" @click="enterTemplate(template)">
              <img src="@/assets/UI/进入实验箭头白色.svg" alt="进入">
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增密码验证模态框 -->
    <div v-if="showPasswordModal" class="password-modal">
      <div class="modal-content">
        <h3>请输入密码</h3>
        <input 
          type="password" 
          v-model="inputPassword"
          placeholder="请输入密码"
          class="password-input"
          @keyup.enter="verifyPassword"
          ref="passwordInput"
        >
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="handleCancel">取消</button>
          <button class="modal-btn confirm-btn" @click="verifyPassword">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import templateService from '@/services/templateService';

export default {
  name: 'TemplatePage',
  
  setup() {
    const router = useRouter();
    const store = useStore();
    const searchQuery = ref('');
    const templates = ref([]);
    const currentType = ref('风型');
    
    // 新增密码验证相关状态
    const showPasswordModal = ref(false);
    const inputPassword = ref('');
    const currentTemplate = ref(null);
    const passwordInput = ref(null);

    onMounted(async () => {
      try {
        const data = await templateService.getAllTemplates()
        templates.value = data.map(template => ({
          ...template,
          date: new Date(template.createTime).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }))
      } catch (error) {
        console.error('获取模板列表失败:', error)
      }
    })

    const switchType = (type) => {
      currentType.value = type;
      store.dispatch('templates/setCurrentType', type);
    };

    const filteredTemplates = computed(() => {
      let result = templates.value.filter(template => 
        template.type === currentType.value
      )
      
      if (!searchQuery.value) return result
      const query = searchQuery.value.toLowerCase()
      return result.filter(template => 
        template.title?.toLowerCase().includes(query) ||
        template.creator?.toLowerCase().includes(query) ||
        template.date?.toLowerCase().includes(query) ||
        template.id?.toLowerCase().includes(query)
      )
    })
    
    const viewTemplate = async (template) => {
  try {
    // 获取模板文档信息
    const docInfo = await templateService.getTemplateDocument(template.id);
    
    if (docInfo && docInfo.content) {
      // 将文档内容存储在localStorage中
      localStorage.setItem(`template_doc_${template.id}`, docInfo.content);
      
      // 打开新标签页
      const url = `${window.location.origin}/markdown-viewer.html?type=template&id=${template.id}`;
      window.open(url, '_blank');
    } else {
      // 如果没有文档，则显示提示
      alert('该模板未上传使用文档');
    }
  } catch (error) {
    console.error('获取模板文档失败:', error);
    alert('获取模板文档失败');
  }
};

    // 修改 enterTemplate 方法以添加密码验证
    const enterTemplate = async (template) => {
      currentTemplate.value = template;
      showPasswordModal.value = true;
      await nextTick();
      passwordInput.value?.focus();
    };

    // 新增密码验证相关方法
    const handleCancel = () => {
      showPasswordModal.value = false;
      inputPassword.value = '';
      currentTemplate.value = null;
    };

    const verifyPassword = async () => {
      if (!currentTemplate.value || !inputPassword.value) return;

      try {
        const result = await templateService.verifyPassword(
          currentTemplate.value.id,
          inputPassword.value
        );

        if (result.success) {
          router.push(`/template/${currentTemplate.value.id}`);
        } else {
          alert('密码错误,请重试');
        }
      } catch (error) {
        console.error('验证失败:', error);
        alert('验证失败,请重试');
      } finally {
        inputPassword.value = '';
        showPasswordModal.value = false;
        currentTemplate.value = null;
      }
    };

    return {
      searchQuery,
      templateTypes: ['风型', '过渡'],
      currentType,
      filteredTemplates,
      viewTemplate,
      enterTemplate,
      switchType,
      // 新增返回的状态和方法
      showPasswordModal,
      inputPassword,
      handleCancel,
      verifyPassword,
      passwordInput
    };
  }
};
</script>

<style lang="scss" scoped>
.template-page {
  padding: 1vw;
}

// 标签栏样式
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

// 复制ProjectList.vue的样式并适当修改
.action-bar {
  display: flex;
  gap: 1vw;
  margin-bottom: 2vw;
  margin-left: -1vw;
  align-items: center;
}

.action-container {
  height: 2.5vw;
  width: calc((100% - 5vw) / 6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 1vw;
  border-radius: 0.5vw;
}

.new-project-container {
  background-color: #00A0E9;
  color: white;
  cursor: pointer;
  justify-content: flex-start;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #007ACC;
    transform: scale(1.05);
  }
}

.new-project-icon {
  width: 1.2vw;
  height: 1.2vw;
  margin-right: 0.5vw;
}

.new-project-text {
  font-size: 0.9vw;
  white-space: nowrap;
}

.search-container {
  background: white;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-icon {
  width: 1.2vw;
  height: 1.2vw;
  order: 2;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.search-input {
  border: none;
  outline: none;
  width: 9.8vw;
  font-size: 0.9vw;
  background: transparent;
  margin-right: 0.5vw;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1vw;
  margin-left: -1vw;
}

.project-card {
  background: white;
  border-radius: 0.5vw;
  padding: 1vw;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-0.5vw);
  }

  .project-header {
    display: flex;
    justify-content: space-between;
    color: #666;
    font-size: 0.7vw;
    margin-bottom: 0.8vw;
  }

  .project-title {
    font-size: 0.8vw;
    color: #333;
    margin-bottom: 1vw;
    line-height: 1.4;
    height: 2.8em;
    overflow: hidden;
  }

  .project-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .creator {
      color: #666;
      font-size: 0.7vw;
    }

    .action-buttons {
      display: flex;
      gap: 0.5vw;
    }
  }
}

.action-btn {
  background: #00A0E9;
  border: none;
  padding: 0.6vw;
  border-radius: 0.5vw;
  cursor: pointer;
  transition: all 0.3s ease;

  img {
    width: 1vw;
    height: 1vw;
  }

  &:hover {
    transform: scale(1.1);
  }
}

.password-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .modal-content {
    background: white;
    padding: 2vw;
    border-radius: 0.5vw;
    width: 20vw;

    h3 {
      margin: 0 0 1.5vw;
      font-size: 1.2vw;
      color: #333;
    }

    .password-input {
      width: 100%;
      padding: 0.8vw;
      border: 1px solid #e8e8e8;
      border-radius: 0.3vw;
      margin-bottom: 1.5vw;
      font-size: 0.9vw;
      
      &:focus {
        outline: none;
        border-color: #00A0E9;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1vw;
    }

    .modal-btn {
      padding: 0.6vw 1.2vw;
      border: none;
      border-radius: 0.3vw;
      cursor: pointer;
      font-size: 0.9vw;
      transition: all 0.3s;

      &.cancel-btn {
        background: #f5f5f5;
        color: #666;

        &:hover {
          background: #e8e8e8;
        }
      }

      &.confirm-btn {
        background: #00A0E9;
        color: white;

        &:hover {
          background: #007ACC;
        }
      }
    }
  }
}
</style>