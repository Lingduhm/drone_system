// src/services/projectService.js
import HttpClient from './httpClient';

class ProjectService {
  async getAllProjects() {
    return HttpClient.get('/api/projects');
  }

  async saveProject(projectData) {
    return HttpClient.post('/api/projects', projectData);
  }

  async createFragment(projectId, fragmentData) {
    return HttpClient.post(`/api/projects/${projectId}/fragments`, fragmentData);
  }

  async getProjectFragments(projectId) {
    try {
      console.log('正在请求片段数据，URL:', `/api/projects/${projectId}/fragments`);
      const response = await HttpClient.get(`/api/projects/${projectId}/fragments`);
      return response;
    } catch (error) {
      console.error('获取项目片段失败:', error);
      return []; // 返回空数组而不是抛出错误
    }
  }
}

export default new ProjectService();