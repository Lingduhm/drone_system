import { createStore } from 'vuex'
import projects from './modules/projects'
import experiments from './modules/experiments'
import templates from './modules/templates'
import navigation from './modules/navigation'
import fragments from './modules/fragments'

export default createStore({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    projects,
    experiments,
    templates,
    fragments,
    navigation
  }
})
