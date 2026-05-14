// src/services/fragmentService.js
import { STORAGE_KEYS } from '@/constants'
import { generateId, formatDate } from '@/utils'
import BaseService from './baseService'
import HttpClient from './httpClient'  // 添加这行导入

class FragmentService extends BaseService {
  constructor() {
    super(STORAGE_KEYS.FRAGMENTS)
  }

  async getAllFragments() {
    return this.getAll()
  }

  async saveFragment(fragmentData) {
    const fragments = await this.getAll()
    const newFragment = {
      ...fragmentData,
      id: generateId(),
      date: formatDate(new Date()),
      createTime: new Date().toISOString()
    }
    fragments.unshift(newFragment)
    await this.save(fragments)
    return newFragment
  }

async uploadFragmentDocument(projectId, fragmentId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return await HttpClient.uploadFile(
      `/api/projects/${projectId}/fragments/${fragmentId}/document`, 
      formData
    );
  } catch (error) {
    console.error('上传片段文档失败:', error);
    throw error; 
  }
}

async getFragmentDocument(projectId, fragmentId) {
  try {
    const response = await HttpClient.get(
      `/api/projects/${projectId}/fragments/${fragmentId}/document`
    );
    return response;
  } catch (error) {
    console.error('获取片段文档失败:', error);
    return null;
  }
}

// src/services/fragmentService.js
async downloadFragmentDocument(projectId, fragmentId) {
  try {
    // 先获取文档信息
    const docInfo = await this.getFragmentDocument(projectId, fragmentId);
    if (!docInfo || !docInfo.content) {
      throw new Error('文档不存在或内容为空');
    }

    // 创建下载
    const blob = new Blob([docInfo.content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // 使用服务器返回的原始文件名，如果没有则使用默认名称
    link.download = docInfo.filename || 'fragment-doc.md';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('下载片段文档失败:', error);
    throw error;
  }
}

  // 获取片段信息
  async getFragmentInfo(projectId, fragmentId) {
    try {
      const response = await HttpClient.get(
        `/api/projects/${projectId}/fragments/${fragmentId}/info`
      );
      return response;
    } catch (error) {
      console.error('获取片段信息失败:', error);
      return null;
    }
  }

  // 更新片段信息
  async updateFragmentInfo(projectId, fragmentId, fragmentData) {
    try {
      return await HttpClient.put(
        `/api/projects/${projectId}/fragments/${fragmentId}/info`,
        fragmentData
      );
    } catch (error) {
      console.error('更新片段信息失败:', error);
      throw error;
    }
  }

  async getFragmentConfigFile(projectId, fragmentId) {
    try {
      const info = await this.getFragmentInfo(projectId, fragmentId);
      return {
        windConfig: info.windConfigFile,
        rainConfig: info.rainConfigFile
      };
    } catch (error) {
      console.error('获取片段配置文件信息失败:', error);
      return null;
    }
  }

  async downloadFragmentConfig(projectId, fragmentId, type, filename) {
    try {
      // 使用 fetch 直接下载
      const response = await fetch(`http://${window.location.hostname}:3000/api/projects/${projectId}/fragments/${fragmentId}/csv/${type}/download/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      // 获取文件内容并下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // 使用原始文件名(去掉时间戳和片段id前缀)
      const originalName = filename.split('-').slice(2).join('-');
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载配置文件失败:', error);
      throw error;
    }
  }

  async getPWMData(fragmentId) {
    try {
        console.log('Requesting PWM data for fragment:', fragmentId);
        const response = await HttpClient.get(`/api/fragment/${fragmentId}/pwm`);
        
        if (response.success && response.processedFile) {
            // 使用新的流式读取接口
            return {
                success: true,
                processedFile: response.processedFile,
                streamUrl: `/api/fragment/${fragmentId}/stream-pwm/${response.processedFile}`
            };
        }
        
        throw new Error(response.message || '获取PWM数据失败');
    } catch (error) {
        console.error('获取PWM数据失败:', error);
        throw error;
    }
}

async deleteFragment(projectId, fragmentId) {
  try {
    const response = await HttpClient.delete(`/api/projects/${projectId}/fragments/${fragmentId}`);
    return response;
  } catch (error) {
    console.error('删除片段失败:', error);
    throw error;
  }
}

async verifyPassword(projectId, fragmentId, password) {
  try {
    const response = await HttpClient.post(
      `/api/projects/${projectId}/fragments/${fragmentId}/verify`, 
      { password }
    );
    return response;
  } catch (error) {
    console.error('密码验证失败:', error);
    throw error;
  }
}
}

export default new FragmentService()