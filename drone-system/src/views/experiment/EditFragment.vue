<template>
  <div class="fragment-list">
    <!-- 操作栏 - 保持不变 -->
    <div class="action-bar">
      <div class="action-container new-container" @click="handleNewFragment">
        <img src="@/assets/UI/新建白色.svg" alt="新建" class="new-icon">
        <span class="new-text">新建片段</span>
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

    <!-- 片段网格 - 保持不变 -->
    <div class="fragment-grid">
      <div 
        v-for="fragment in filteredFragments" 
        :key="fragment.id" 
        class="fragment-card"
      >
        <div class="fragment-header">
          <span>{{ fragment.date }}</span>
          <span>{{ fragment.id }}</span>
        </div>
        <div class="fragment-title">{{ fragment.title }}</div>
        <div class="fragment-footer">
          <div class="creator">创建人 {{ fragment.creator }}</div>
          <div class="action-buttons">
            <button class="action-btn" @click="viewFragment(fragment)">
              <img src="@/assets/UI/关于白色24.svg" alt="查看">
            </button>
            <button class="action-btn" @click="editFragment(fragment)">
              <img src="@/assets/UI/进入实验箭头白色.svg" alt="编辑">
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import projectService from '@/services/projectService'
import fragmentService from '@/services/fragmentService'

export default {
  name: 'EditFragment',
  
  setup() {
    const router = useRouter()
    const route = useRoute()
    const searchQuery = ref('')
    const fragments = ref([])
    const loading = ref(false)

    // 新增密码验证相关状态
    const showPasswordModal = ref(false)
    const inputPassword = ref('')
    const currentFragment = ref(null)
    const passwordInput = ref(null)

    const fetchFragments = async () => {
      const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
      if (!projectId) {
        console.error('未找到项目ID');
        return;
      }

      loading.value = true;
      try {
        console.log('开始获取项目片段，项目ID:', projectId);
        const response = await projectService.getProjectFragments(projectId);
        console.log('获取到的片段数据:', response);

        if (Array.isArray(response)) {
          fragments.value = response.map(fragment => ({
            ...fragment,
            date: fragment.createTime ? new Date(fragment.createTime).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : '未知时间'
          }));
          console.log('处理后的片段数据:', fragments.value);
        } else {
          console.error('返回的片段数据不是数组:', response);
          fragments.value = [];
        }
      } catch (error) {
        console.error('获取片段列表失败:', error);
        fragments.value = [];
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchFragments);

    watch(
      () => route.fullPath,
      () => {
        console.log('路由发生变化，重新获取片段');
        fetchFragments();
      }
    );

    const filteredFragments = computed(() => {
      console.log('过滤前的片段数据:', fragments.value);
      if (!searchQuery.value) return fragments.value;
      const query = searchQuery.value.toLowerCase();
      return fragments.value.filter(fragment => 
        (fragment.title || '').toLowerCase().includes(query) ||
        (fragment.creator || '').toLowerCase().includes(query) ||
        (fragment.date || '').toLowerCase().includes(query) ||
        (fragment.id || '').toLowerCase().includes(query)
      );
    });

    const handleNewFragment = () => {
      const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
      router.push({
        path: '/experiment/fragment/new',
        query: { projectId }
      });
    };

    const viewFragment = async (fragment) => {
  try {
    const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
    if (!projectId) {
      alert('未找到项目ID');
      return;
    }
    
    // 获取片段文档信息
    const docInfo = await fragmentService.getFragmentDocument(projectId, fragment.id);
    
    if (docInfo && docInfo.content) {
      // 将文档内容存储在localStorage中
      localStorage.setItem(`fragment_doc_${fragment.id}`, docInfo.content);
      
      // 打开新标签页
      const url = `${window.location.origin}/markdown-viewer.html?type=fragment&id=${fragment.id}`;
      window.open(url, '_blank');
    } else {
      // 如果没有文档，则显示提示
      alert('该片段未上传使用文档');
    }
  } catch (error) {
    console.error('获取片段文档失败:', error);
    alert('获取片段文档失败');
  }
};

    // 修改 editFragment 方法以添加密码验证
    const editFragment = async (fragment) => {
      currentFragment.value = fragment;
      showPasswordModal.value = true;
      await nextTick();
      passwordInput.value?.focus();
    };

    // 新增密码验证相关方法
    const handleCancel = () => {
      showPasswordModal.value = false;
      inputPassword.value = '';
      currentFragment.value = null;
    };

    const verifyPassword = async () => {
      if (!currentFragment.value || !inputPassword.value) return;

      try {
        const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
        const result = await fragmentService.verifyPassword(
          projectId,
          currentFragment.value.id,
          inputPassword.value
        );

        if (result.success) {
          router.push({
            path: `/experiment/fragment/${currentFragment.value.id}`,
            query: { projectId }
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
        currentFragment.value = null;
      }
    };

    return {
      searchQuery,
      filteredFragments,
      viewFragment,
      editFragment,
      handleNewFragment,
      loading,
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
.fragment-list {
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

.new-container {
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

.new-icon {
  width: 1.2vw;
  height: 1.2vw;
  margin-right: 0.5vw;
}

.new-text {
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

.fragment-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1vw;
  margin-left: -1vw;
}

.fragment-card {
  background: white;
  border-radius: 0.5vw;
  padding: 1vw;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-0.5vw);
  }

  .fragment-header {
    display: flex;
    justify-content: space-between;
    color: #666;
    font-size: 0.7vw;
    margin-bottom: 0.8vw;
  }

  .fragment-title {
    font-size: 0.8vw;
    color: #333;
    margin-bottom: 1vw;
    line-height: 1.4;
    height: 2.8em;
    overflow: hidden;
  }

  .fragment-footer {
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