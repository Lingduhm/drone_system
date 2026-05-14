// src/store/modules/fragments.js
import fragmentService from '@/services/fragmentService'

export default {
  namespaced: true,
  
  state: {
    fragments: []
  },

  mutations: {
    SET_FRAGMENTS(state, fragments) {
      state.fragments = fragments
    },
    ADD_FRAGMENT(state, fragment) {
      state.fragments.unshift(fragment)
    }
  },

  actions: {
    async fetchFragments({ commit }) {
      const fragments = await fragmentService.getAllFragments()
      commit('SET_FRAGMENTS', fragments)
    },

    async addFragment({ commit }, fragmentData) {
      const newFragment = await fragmentService.saveFragment(fragmentData)
      commit('ADD_FRAGMENT', newFragment)
      return newFragment
    }
  },

  getters: {
    allFragments: state => state.fragments,
    filteredFragments: (state) => (query) => {
      if (!query) return state.fragments
      const searchText = query.toLowerCase()
      return state.fragments.filter(fragment => 
        fragment.title.toLowerCase().includes(searchText) ||
        fragment.creator.toLowerCase().includes(searchText)
      )
    }
  }
}