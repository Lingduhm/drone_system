// src/store/modules/templates.js
import templateService from '@/services/templateService'

// src/store/modules/templates.js
export default {
  namespaced: true,
  
  state: {
    templates: [],
    currentType: '风型', // 默认显示风型模板
  },

  mutations: {
    SET_TEMPLATES(state, templates) {
      state.templates = templates
    },
    ADD_TEMPLATE(state, template) {
      state.templates.unshift(template)
    },
    SET_CURRENT_TYPE(state, type) {
      state.currentType = type
    }
  },

  actions: {
    async fetchTemplates({ commit }) {
      const templates = await templateService.getAllTemplates()
      commit('SET_TEMPLATES', templates)
    },

    async addTemplate({ commit, state }, templateData) {
      const newTemplate = await templateService.saveTemplate({
        ...templateData,
        type: state.currentType // 添加模板类型
      })
      commit('ADD_TEMPLATE', newTemplate)
      return newTemplate
    },

    setCurrentType({ commit }, type) {
      commit('SET_CURRENT_TYPE', type)
    }
  },

  getters: {
    allTemplates: state => state.templates,
    currentType: state => state.currentType,
    getTemplateById: (state) => (id) => {
      return state.templates.find(template => template.id === id)
    },
    filteredTemplates: (state) => (query) => {
      // 先按类型过滤
      const typeFiltered = state.templates.filter(template => 
        template.type === state.currentType
      )
      // 再按搜索词过滤
      if (!query) return typeFiltered
      const searchText = query.toLowerCase()
      return typeFiltered.filter(template => 
        template.title.toLowerCase().includes(searchText) ||
        template.creator.toLowerCase().includes(searchText) ||
        template.date.toLowerCase().includes(searchText) ||
        template.id.toLowerCase().includes(searchText)
      )
    }
  }
}