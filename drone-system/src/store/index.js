import { createStore } from 'vuex'
import projects from './modules/projects'
import experiments from './modules/experiments'
import templates from './modules/templates'
import navigation from './modules/navigation'
import fragments from './modules/fragments'
import windTest from './modules/windTest'
import fragmentPlayback from './modules/fragmentPlayback'
import experimentPlayback from './modules/experimentPlayback'

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
    navigation,
    windTest,
    fragmentPlayback,
    experimentPlayback
  }
})
