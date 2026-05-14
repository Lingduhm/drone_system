// src/store/modules/projects.js
import projectService from '@/services/projectService'

export default {
  namespaced: true,
  
  state: {
    projects: []
  },

  mutations: {
    SET_PROJECTS(state, projects) {
      state.projects = projects
    },

    ADD_PROJECT(state, project) {
      state.projects.unshift(project)
    },

    UPDATE_PROJECT(state, project) {
      const index = state.projects.findIndex(p => p.id === project.id)
      if (index !== -1) {
        state.projects[index] = project
      }
    },

    DELETE_PROJECT(state, projectId) {
      state.projects = state.projects.filter(p => p.id !== projectId)
    }
  },

  actions: {
    async fetchProjects({ commit }) {
      try {
        const projects = await projectService.getAllProjects()
        commit('SET_PROJECTS', projects)
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    },

    async addProject({ commit }, projectData) {
      try {
        // 确保发送完整的项目数据
        const newProject = await projectService.saveProject({
          ...projectData,
          createTime: new Date().toISOString()
        });
        commit('ADD_PROJECT', newProject);
        return newProject;
      } catch (error) {
        console.error('Error adding project:', error);
        throw error;
      }
    },

    async updateProject({ commit }, projectData) {
      try {
        const updatedProject = await projectService.updateProject(projectData)
        commit('UPDATE_PROJECT', updatedProject)
        return updatedProject
      } catch (error) {
        console.error('Error updating project:', error)
        throw error
      }
    },

    async deleteProject({ commit }, projectId) {
      try {
        await projectService.deleteProject(projectId)
        commit('DELETE_PROJECT', projectId)
      } catch (error) {
        console.error('Error deleting project:', error)
        throw error
      }
    }
  },

  getters: {
    allProjects: state => state.projects,
    getProjectById: state => id => state.projects.find(project => project.id === id)
  }
}