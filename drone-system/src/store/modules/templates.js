// src/store/modules/templates.js
import templateService from '@/services/templateService'

const TEMPLATE_TYPES = ['风型', '雨型', '过渡']

export default {
  namespaced: true,
  
  state: {
    templates: [],
    currentType: TEMPLATE_TYPES[0]
  },

  mutations: {
    SET_TEMPLATES(state, templates) {
      state.templates = templates
    },
    ADD_TEMPLATE(state, template) {
      state.templates.unshift(template)
    },
    SET_CURRENT_TYPE(state, type) {
      if (TEMPLATE_TYPES.includes(type)) {
        state.currentType = type
      }
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
        type: state.currentType
      })
      commit('ADD_TEMPLATE', newTemplate)
      return newTemplate
    }
  },

  getters: {
    templateTypes: () => TEMPLATE_TYPES,
    currentType: state => state.currentType,
    filteredTemplates: state => query => {
      // 先按当前类型过滤
      const typeFiltered = state.templates.filter(t => t.type === state.currentType)
      
      if (!query) return typeFiltered
      const searchText = query.toLowerCase()
      
      return typeFiltered.filter(t => 
        t.title?.toLowerCase().includes(searchText) ||
        t.creator?.toLowerCase().includes(searchText)
      )
    },
    getTemplateById: state => id => state.templates.find(t => t.id === id)
  }
}