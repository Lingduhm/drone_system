<template>
  <div class="project-list">
    <!-- 操作栏 -->
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

    <!-- 项目网格 -->
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
//import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import projectService from '@/services/projectService';

export default {
  name: 'ProjectList',
  
  setup() {
    //const store = useStore();
    const router = useRouter();
    const searchQuery = ref('');
    const projects = ref([]);

    onMounted(async () => {
      try {
        const data = await projectService.getAllProjects();
        // 为每个项目添加格式化的日期
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

    const viewProject = (project) => {
      console.log('查看项目:', project.id);
    };

    const enterProject = (project) => {
  console.log('进入项目，ID:', project.id);
  // 先在 localStorage 中保存项目 ID，以确保整个流程都能访问到
  localStorage.setItem('currentProjectId', project.id);
  router.push({
    path: '/experiment',
    query: { projectId: project.id }
  });
};

    return {
      searchQuery,
      filteredProjects,
      viewProject,
      enterProject
    };
  }
};
</script>


<style lang="scss" scoped>
// 复用相同的样式
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
</style>