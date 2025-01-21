// src/store/modules/experiments.js
import experimentService from '@/services/experimentService'

export default {
  namespaced: true,

  state: {
    experiments: [],
    xyzData: [],
    currentTab: '实验记录',
    selectedFragment: '',
    controlSelectedFragment: 'A',
    playbackProgress: 25,
    isPlaying: false
  },

  mutations: {
    SET_EXPERIMENTS(state, experiments) {
      state.experiments = experiments
    },
    
    TOGGLE_EXPERIMENT_SELECT(state, experimentId) {
      const experiment = state.experiments.find(e => e.id === experimentId)
      if (experiment) {
        experiment.selected = !experiment.selected
      }
    },

    SET_CURRENT_TAB(state, tab) {
      state.currentTab = tab
    },

    SET_PLAYBACK_PROGRESS(state, progress) {
      state.playbackProgress = progress
    },

    SET_PLAYING_STATE(state, isPlaying) {
      state.isPlaying = isPlaying
    }
  },

  actions: {
    async fetchExperiments({ commit }, projectId) {
      const experiments = await experimentService.getExperimentsByProject(projectId)
      commit('SET_EXPERIMENTS', experiments)
    },

    async toggleExperimentSelect({ commit }, experimentId) {
      await experimentService.toggleExperimentSelect(experimentId)
      commit('TOGGLE_EXPERIMENT_SELECT', experimentId)
    }
  },

  getters: {
    filteredExperiments: state => query => {
      if (!query) return state.experiments
      query = query.toLowerCase()
      return state.experiments.filter(exp => 
        exp.name.toLowerCase().includes(query)
      )
    },
    filteredRecords: (state) => (query) => {
      if (!query) return state.experiments
      const searchText = query.toLowerCase()
      return state.experiments.filter(record => 
        record.name.toLowerCase().includes(searchText)
      )
    }
  }
}