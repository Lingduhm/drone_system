<!-- src/components/layout/BaseLayout.vue -->
<template>
  <div class="app-layout">
    <DroneHeader :title="currentTitle" :type="layoutType" />
    <div class="main-container">
      <DroneSidebar :type="layoutType" />
      <div class="content-area">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import DroneHeader from './Header.vue'
import DroneSidebar from './Sidebar.vue'

export default {
  name: 'BaseLayout',
  
  components: {
    DroneHeader,
    DroneSidebar
  },

  props: {
    type: {
      type: String,
      default: 'project'
    }
  },

  setup(props) {
    const store = useStore()
    const route = useRoute()
    
    const currentTitle = computed(() => store.getters['navigation/currentTitle'])
    
    // 根据路由参数设置正确的类型
    const layoutType = computed(() => {
      if (route.matched.some(record => record.name === 'TemplateDetail')) {
        return 'template-detail'
      }
      return props.type
    })

    return {
      currentTitle,
      layoutType
    }
  }
}
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background-color: rgb(242, 242, 242);
}

.main-container {
  display: flex;
  min-height: calc(100vh - calc(12.7vw * 0.333));
}

.content-area {
  flex: 1;
  padding: 1vw 2vw;
}
</style>