// src/store/modules/navigation.js
export default {
  namespaced: true,
  
  state: {
    currentTitle: localStorage.getItem('currentTitle') || '项目',
    experimentTitle: localStorage.getItem('experimentTitle') || null,
    // 定义不同页面的侧边栏菜单和对应标题
    menuConfigs: {
      project: [
        { name: '项目', path: '/project', icon: '项目', title: '项目' },
        { name: '模板', path: '/template', icon: '模板', title: '模板' },
        { name: '测试', path: '/test', icon: '测试', title: '测试' },
        { name: '设置', path: '/settings', icon: '设置', title: '设置' },
        { name: '关于', path: '/about', icon: '关于', title: '关于' }
      ],
      experiment: [
        { name: '实验主页', path: '/experiment', icon: '主页', title: '' },
        { name: '片段编辑', path: '/experiment/edit', icon: '片段', title: '' },
        { name: '设置', path: '/experiment/settings', icon: '设置', title: '' },
        { name: '返回项目', path: '/project', icon: '项目', title: '项目' }
      ],
      'template-detail': [
        { name: '返回模板', path: '/template', icon: '模板', title: '模板' }
      ],
      'fragment-detail': [
        { name: '返回片段', path: '/experiment/edit', icon: '返回', title: '片段编辑' }
      ]
    }
  },

  mutations: {
    SET_TITLE(state, title) {
      state.currentTitle = title
      localStorage.setItem('currentTitle', title)
    },
    SET_EXPERIMENT_TITLE(state, title) {
      state.experimentTitle = title
      if (title) {
        localStorage.setItem('experimentTitle', title)
      } else {
        localStorage.removeItem('experimentTitle')
      }
    }
  },

  getters: {
    currentTitle: state => {
      return state.experimentTitle || state.currentTitle
    },
    getMenuConfig: state => type => state.menuConfigs[type] || state.menuConfigs.project,
    // 新增：根据路径获取标题
    getTitleByPath: state => path => {
      for (const type in state.menuConfigs) {
        const menu = state.menuConfigs[type].find(item => item.path === path)
        if (menu) return menu.title
      }
      return '项目'
    }
  }
}