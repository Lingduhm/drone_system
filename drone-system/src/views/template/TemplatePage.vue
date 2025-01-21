<template>
  <div class="template-page">
    <!-- 标签栏 -->
    <div class="template-header">
      <div class="experiment-tabs">
        <div
          v-for="type in templateTypes"
          :key="type"
          class="tab"
          :class="{ active: currentType === type }"
          @click="switchType(type)"
        >
          {{ type }}
        </div>
      </div>
    </div>

    <!-- 操作栏 - 与ProjectList保持一致的类名和样式 -->
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

    <!-- 模板网格 - 使用与ProjectList相同的网格样式 -->
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
      <!-- 修改这里，添加 enterTemplate 事件 -->
      <button class="action-btn" @click="enterTemplate(template)">
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
import { useRouter } from 'vue-router';
import templateService from '@/services/templateService';
import { useStore } from 'vuex';  

export default {
  name: 'TemplatePage',
  
  setup() {
    const router = useRouter();
    const store = useStore();
    const searchQuery = ref('');
    const templates = ref([]);
    const currentType = ref('风型');

    onMounted(async () => {
      try {
        const data = await templateService.getAllTemplates();
        // 添加格式化的日期
        templates.value = data.map(template => ({
          ...template,
          date: new Date(template.createTime).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
      } catch (error) {
        console.error('获取模板列表失败:', error);
      }
    });

    const switchType = (type) => {  // 添加这个函数
      currentType.value = type;
      store.dispatch('templates/setCurrentType', type);
    };

    const filteredTemplates = computed(() => {
      if (!searchQuery.value) return templates.value || [];
      const query = searchQuery.value.toLowerCase();
      return (templates.value || []).filter(template => {
        return template && (
          template.title?.toLowerCase().includes(query) ||
          template.creator?.toLowerCase().includes(query) ||
          template.date?.toLowerCase().includes(query) ||
          template.id?.toLowerCase().includes(query)
        );
      });
    });

    const viewTemplate = (template) => {
      console.log('查看模板:', template.id);
    };

    const enterTemplate = (template) => {
      router.push(`/template/${template.id}`);
    };

    return {
      searchQuery,
      templateTypes: ['风型', '雨型', '过渡'],
      currentType,
      filteredTemplates,
      viewTemplate,
      enterTemplate,
      switchType
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
</style>