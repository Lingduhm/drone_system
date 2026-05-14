<template>
  <div class="drone-header">
    <div class="logo-section">
      <img class="blue-rect" src="@/assets/UI/无人机蓝色矩形底色.svg" alt="背景">
      <img class="white-drone" src="@/assets/UI/无人机白色.svg" alt="无人机">
    </div>
    <div class="title-section">
      <img :src="getIconSource" :alt="title" :class="{'template-icon': isTemplateIcon}">
      <div class="vertical-line"></div>
      <span class="title-text">{{ title }}</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'DroneHeader',
  props: {
    type: {
      type: String,
      default: 'project'
    }
  },

  setup(props) {
    const store = useStore();
    
    const title = computed(() => store.getters['navigation/currentTitle']);
    
    const isTemplateIcon = computed(() => {
      return props.type === 'template-detail' || title.value === '模板'
    });

    const getIconSource = computed(() => {
      // 如果是实验相关页面，统一使用主页蓝色图标
      if (props.type === 'experiment') {
        return require('@/assets/UI/主页蓝色.svg');
      }
      
      // 如果是模板详情页或模板页面，使用模板蓝色图标
      if (isTemplateIcon.value) {
        return require('@/assets/UI/模板蓝色.svg');
      }
      
      const iconMap = {
        '项目': 'UI/项目蓝色.svg',
        '测试': 'UI/测试蓝色.svg',
        '设置': 'UI/设置蓝色.svg',
        '关于': 'UI/关于蓝色.svg'
      };
      return require(`@/assets/${iconMap[title.value] || iconMap['项目']}`);
    });

    return {
      title,
      isTemplateIcon,
      getIconSource
    };
  }
}
</script>

<style lang="scss" scoped>
.drone-header {
  display: flex;
  height: calc(12.7vw * 0.333);
  position: relative;
}

.logo-section {
  position: relative;
  width: 12.7vw;
  
  .blue-rect {
    width: 100%;
    height: 100%;
  }
  
  .white-drone {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 61.8%;
    height: auto;
  }
}

.title-section {
  flex: 1;
  background: white;
  display: flex;
  align-items: center;
  padding-left: 1.4vw;
  
  img {
    width: 2vw;
    height: 2vw;
    
    &.template-icon {
      width: 2vw;
      height: 2vw;
    }
  }
  
  .vertical-line {
    width: 0.13vw;
    height: 2.5vw;
    background-color: rgb(232, 232, 232);
    margin: 0 1.3vw;
  }
  
  .title-text {
    font-size: 1.7vw;
    font-weight: bold;
    color: black;
    margin: 0 0 0.2vw;
  }
}
</style>