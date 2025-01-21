<template>
  <div class="fragment-list">
    <!-- 操作栏 -->
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

    <!-- 片段网格 -->
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
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import projectService from '@/services/projectService'

export default {
  name: 'EditFragment',
  
  setup() {
    const router = useRouter()
    const route = useRoute()
    const searchQuery = ref('')
    const fragments = ref([])
    const loading = ref(false)

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

    // 初始加载
    onMounted(fetchFragments);

    // 监听路由变化
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

   const viewFragment = (fragment) => {
     console.log('查看片段:', fragment.id);
   };

   const editFragment = (fragment) => {
     const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
     router.push({
       path: `/experiment/fragment/${fragment.id}`,
       query: { projectId }
     });
   };

   return {
     searchQuery,
     filteredFragments,
     viewFragment,
     editFragment,
     handleNewFragment,
     loading
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
</style>