<template>
  <div class="test-page">
    <!-- 顶部标签栏 -->
    <div class="template-header">
      <div class="experiment-tabs">
        <div
          v-for="type in testTypes"
          :key="type.name"
          class="tab"
          :class="{ active: currentType === type.name }"
          @click="switchType(type.path)"
        >
          {{ type.name }}
        </div>
      </div>
    </div>

    <!-- 路由出口 -->
    <router-view></router-view>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'TestPage',
  
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const testTypes = [
      { name: '动捕', path: '/test' },
      { name: '风洞', path: '/test/wind' },
      { name: '雨雾', path: '/test/rain' }
    ]

    const currentType = computed(() => {
      switch (route.path) {
        case '/test/wind':
          return '风洞'
        case '/test/rain':
          return '雨雾'
        default:
          return '动捕'
      }
    })

    const switchType = (path) => {
      router.push(path)
    }

    return {
      testTypes,
      currentType,
      switchType
    }
  }
}
</script>

<style lang="scss" scoped>
.test-page {
  display: flex;
  flex-direction: column;
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
</style>