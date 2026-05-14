<template>
  <div class="project-list">
    <!-- 操作栏和项目网格保持不变 -->
    <div class="action-bar">
      <div class="action-container new-project-container" @click="$router.push('/project/new')">
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

    <div class="project-grid">
      <div 
        v-for="project in filteredProjects" 
        :key="project.id" 
        class="project-card"
      >
        <div class="project-header">
          <span>{{ project.date }}</span>
          <span>{{ project.id }}</span>
        </div>
        <div class="project-title">{{ project.title }}</div>
        <div class="project-footer">
          <div class="creator">创建人 {{ project.creator }}</div>
          <div class="action-buttons">
            <button class="action-btn" @click="viewProject(project)">
              <img src="@/assets/UI/关于白色24.svg" alt="查看">
            </button>
            <button class="action-btn" @click="enterProject(project)">
              <img src="@/assets/UI/进入实验箭头白色.svg" alt="进入">
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增密码验证模态窗口 -->
    <div v-if="showPasswordModal" class="password-modal">
      <div class="modal-content">
        <h3>请输入密码</h3>
        <input 
          type="password" 
          v-model="inputPassword"
          placeholder="请输入项目密码"
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
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import projectService from '@/services/projectService';

export default {
  name: 'ProjectList',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    const searchQuery = ref('');
    const projects = ref([]);
    const showPasswordModal = ref(false);
    const inputPassword = ref('');
    const currentProject = ref(null);
    const passwordInput = ref(null);

    onMounted(async () => {
      try {
        const data = await projectService.getAllProjects();
        projects.value = data.map(project => ({
          ...project,
          date: new Date(project.createTime).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
      } catch (error) {
        console.error('获取项目列表失败:', error);
      }
    });

    const filteredProjects = computed(() => {
      if (!searchQuery.value) return projects.value;
      const query = searchQuery.value.toLowerCase();
      return projects.value.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.creator.toLowerCase().includes(query) ||
        project.date.toLowerCase().includes(query) ||
        project.id.toLowerCase().includes(query)
      );
    });

    const viewProject = async (project) => {
  try {
    // 获取项目文档信息
    const docInfo = await projectService.getProjectDocument(project.id);
    
    if (docInfo && docInfo.content) {
      // 将文档内容存储在localStorage中
      localStorage.setItem(`project_doc_${project.id}`, docInfo.content);
      
      // 打开新标签页
      const url = `${window.location.origin}/markdown-viewer.html?type=project&id=${project.id}`;
      window.open(url, '_blank');
    } else {
      // 如果没有文档，则显示提示
      alert('该项目未上传使用文档');
    }
  } catch (error) {
    console.error('获取项目文档失败:', error);
    alert('获取项目文档失败');
  }
};

    const enterProject = async (project) => {
      currentProject.value = project;
      showPasswordModal.value = true;
      // 等待模态窗口显示后聚焦输入框
      await nextTick();
      passwordInput.value?.focus();
    };

    const handleCancel = () => {
      showPasswordModal.value = false;
      inputPassword.value = '';
      currentProject.value = null;
    };

    const verifyPassword = async () => {
      if (!currentProject.value || !inputPassword.value) return;

      try {
        const result = await projectService.verifyPassword(
          currentProject.value.id,
          inputPassword.value
        );

        if (result.success) {
          localStorage.setItem('currentProjectId', currentProject.value.id);
          store.commit('navigation/SET_EXPERIMENT_TITLE', currentProject.value.title);
          router.push({
            path: '/experiment',
            query: { projectId: currentProject.value.id }
          });
        } else {
          alert('密码错误,请重试');
        }
      } catch (error) {
        console.error('验证失败:', error);
        alert('验证失败,请重试');
      } finally {
        inputPassword.value = '';
        showPasswordModal.value = false;
        currentProject.value = null;
      }
    };

    return {
      searchQuery,
      filteredProjects,
      viewProject,
      enterProject,
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

.project-list {
  padding: 1vw;
}

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

// 新增模态窗口样式
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