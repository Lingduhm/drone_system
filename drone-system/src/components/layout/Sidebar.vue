<!-- src/components/layout/Sidebar.vue -->
<template>
  <div class="sidebar">
    <div class="sidebar-nav">
      <div
        v-for="item in menuItems"
        :key="item.name"
        :class="['sidebar-item', { active: currentPath === item.path }]"
        @click="navigate(item)"
      >
        <img :src="getIcon(item)" :alt="item.name">
        <span>{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'DroneSidebar',
  props: {
    type: {
      type: String,
      default: 'project'
    }
  },
  setup(props) {
    console.log('Sidebar type:', props.type) // 添加调试日志
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    const menuItems = computed(() => {
      console.log('Getting menu config for type:', props.type) // 添加调试日志
      return store.getters['navigation/getMenuConfig'](props.type)
    })
    const currentPath = computed(() => {
  // 优先使用路由的 activeMenu
  if (route.meta.activeMenu) {
    return route.meta.activeMenu
  }
  // 如果是测试的子路由，返回父级路由路径
  if (route.path.startsWith('/test/')) {
    return '/test'
  }
  return route.path
})
    const getIcon = (item) => {
      const isActive = currentPath.value === item.path
      const state = isActive ? '白色' : '蓝色'
      return require(`@/assets/UI/${item.icon}${state}.svg`)
    }

const navigate = (item) => {
  if (item.name === '返回项目') {
    store.commit('navigation/SET_EXPERIMENT_TITLE', null);  // 清除实验标题
    localStorage.removeItem('currentProjectId');  // 可选：清除本地存储的项目ID
    router.push('/project');
  } else {
    router.push(item.path);
  }
}
    return {
      menuItems,
      currentPath,
      getIcon,
      navigate
    }
  }
}
</script>
<style lang="scss" scoped>
.sidebar {
  width: 7vw;
  background-color: rgb(242, 242, 242);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - calc(12.7vw * 0.333));
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 1vw;
    width: 2px;
    height: calc(100% - 2vw);
    background-color: rgb(232, 232, 232);
  }
}

.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75vw;
  cursor: pointer;
  position: relative;
  margin-bottom: -0.1vw;
  
  img {
    width: 2vw;
    height: 2vw;
    margin-bottom: 0.5vw;
    position: relative;
    z-index: 1;
    transition: filter 0.3s; // 添加过渡效果
  }
  
  span {
    font-size: 0.8vw;
    color: #4f4f4f;
    font-weight: 600;
    position: relative;
    padding: 0.5vw 0;
    transition: color 0.3s;
    margin-top:0.7vw;
    /* 文字上下分隔线 */
    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 3vw;
      height: 1px;
      background-color: rgb(232, 232, 232);
    }
    &::before {
      top: 0.2vw;
    }
    &::after {
      bottom: 0.2vw;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 3.5vw;
    height: 3.5vw;
    background-color: white;
    border-radius: 0.5vw;
    z-index: 0;
    transition: background-color 0.3s;
  }
  
  &:hover {
    &::before {
      background-color: #00A0E9;
    }

    img {
      filter: brightness(0) invert(1); // 使图片先变黑后变白
    }

    span {
      color: #00A0E9;
    }
  }

  &.active {
    &::before {
      background-color: #00A0E9;
    }

    img {
      filter: brightness(0) invert(1); // 使图片先变黑后变白
    }

    span {
      color: #00A0E9;
    }
  }
}
</style>
