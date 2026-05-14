// src/store/modules/experiments.js
import HttpClient from '@/services/httpClient'

export default {
  namespaced: true,
  
  state: {
    experiments: [],
    xyzData: [],
    currentTab: '实验记录',
    selectedFragment: null,
    controlSelectedFragment: 'A',
    playbackProgress: 25,
    isPlaying: false
  },

  mutations: {
    SET_EXPERIMENTS(state, experiments) {
      state.experiments = experiments
    },
    
    SET_SELECTED_FRAGMENT(state, fragment) {
      state.selectedFragment = fragment;
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
      try {
        const response = await HttpClient.get(`/api/projects/${projectId}/experiments`);
        commit('SET_EXPERIMENTS', response);
        return response;
      } catch (error) {
        console.error('获取实验列表失败:', error);
        return [];
      }
    },

    async toggleExperimentSelect({ commit }, experimentId) {
      try {
        const response = await HttpClient.post(`/api/experiments/${experimentId}/toggle`);
        if (response.success) {
          commit('TOGGLE_EXPERIMENT_SELECT', experimentId);
        }
        return response;
      } catch (error) {
        console.error('切换实验选择状态失败:', error);
        throw error;
      }
    },

    setSelectedFragment({ commit }, fragment) {
      commit('SET_SELECTED_FRAGMENT', fragment)
    }
  },

  getters: {
    selectedFragment: state => state.selectedFragment,
    filteredExperiments: state => query => {
      if (!query) return state.experiments
      query = query.toLowerCase()
      return state.experiments.filter(exp => 
        exp.name.toLowerCase().includes(query)
      )
    }
  }
}