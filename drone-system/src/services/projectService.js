// src/services/projectService.js
import HttpClient from './httpClient';

class ProjectService {
  async getAllProjects() {
    return HttpClient.get('/api/projects');
  }

  async saveProject(projectData) {
    try {
      // 确保所有字段都被发送
      const project = {
        title: projectData.title || '',
        creator: projectData.creator || '',
        password: projectData.password || '',
        contact: projectData.contact || '',
        description: projectData.description || '',
        createTime: new Date().toISOString()
      };
      
      return await HttpClient.post('/api/projects', project);
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
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

  async uploadProjectDocument(projectId, file) {
    try {
      const formData = new FormData();
      // 确保文件以正确的字段名传递
      formData.append('file', file, file.name);  // 添加第三个参数确保文件名被正确传递
      console.log('Uploading document:', file.name, formData.get('file')); // 添加日志检查
  
      return await HttpClient.uploadFile(`/api/projects/${projectId}/document`, formData);
    } catch (error) {
      console.error('上传项目文档失败:', error);
      throw error;
    }
  }

  async getProjectDocument(projectId) {
    try {
      return await HttpClient.get(`/api/projects/${projectId}/document`);
    } catch (error) {
      console.error('获取项目文档失败:', error);
      return null;
    }
  }

  async downloadProjectDocument(projectId) {
    try {
      // 先获取文档信息
      const docInfo = await this.getProjectDocument(projectId);
      
      // 获取文件内容
      const response = await HttpClient.download(`/api/projects/${projectId}/document`);
      
      // 使用服务器返回的原始文件名，如果没有则使用默认名称
      const fileName = docInfo.filename || 'document.md';  // 修改这里
      
      // 创建下载链接
      const blob = new Blob([response], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;  // 使用原始文件名
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('下载项目文档失败:', error);
      throw error;
    }
  }

  async getProjectInfo(projectId) {
    try {
      return await HttpClient.get(`/api/projects/${projectId}/info`);
    } catch (error) {
      console.error('获取项目信息失败:', error);
      return null;
    }
  }
  
  async updateProjectInfo(projectId, projectData) {
    try {
      return await HttpClient.put(`/api/projects/${projectId}/info`, projectData);
    } catch (error) {
      console.error('更新项目信息失败:', error);
      throw error;
    }
  }

  async deleteProject(projectId) {
    try {
      // 确保发送到正确的API路径
      const response = await HttpClient.delete(`/api/projects/${projectId}`);
      return response;
    } catch (error) {
      console.error('删除项目失败:', error);
      throw error;
    }
  }

  async verifyPassword(projectId, password) {
    try {
      const response = await HttpClient.post(`/api/projects/${projectId}/verify`, { password });
      return response;
    } catch (error) {
      console.error('密码验证失败:', error);
      throw error;
    }
  }
}

export default new ProjectService();