// src/services/templateService.js
import HttpClient from './httpClient';

class TemplateService {
  async getAllTemplates() {
    return HttpClient.get('/api/templates');
  }

  async saveTemplate(templateData) {
    return HttpClient.post('/api/templates', templateData);
  }

    // 新增文档相关方法
    async uploadTemplateDocument(templateId, file) {
      try {
        const formData = new FormData();
        // 确保正确设置文件名
        formData.append('file', file, file.name);
        console.log('正在上传模板文档:', templateId, file.name);  // 添加调试日志
        return await HttpClient.uploadFile(
          `/api/templates/${templateId}/document`, 
          formData
        );
      } catch (error) {
        console.error('上传模板文档失败:', error);
        throw error;
      }
    }
  
    async getTemplateDocument(templateId) {
      try {
        const response = await HttpClient.get(`/api/templates/${templateId}/document`);
        return response;
      } catch (error) {
        console.error('获取模板文档失败:', error);
        return null;
      }
    }
  
    async downloadTemplateDocument(templateId) {
      try {
        // 先获取文档信息
        const docInfo = await this.getTemplateDocument(templateId);
        if (!docInfo || !docInfo.content) {
          throw new Error('文档不存在或内容为空');
        }
  
        // 创建下载
        const blob = new Blob([docInfo.content], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = docInfo.filename || 'template-doc.md';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return true;
      } catch (error) {
        console.error('下载模板文档失败:', error);
        throw error;
      }
    }

    async uploadTemplateConfig(templateId, file) {
      try {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return await HttpClient.uploadFile(`/api/templates/${templateId}/config`, formData);
      } catch (error) {
        console.error('上传模板配置文件失败:', error);
        throw error;
      }
    }
    
    async getTemplateConfig(templateId) {
      try {
        return await HttpClient.get(`/api/templates/${templateId}/config`);
      } catch (error) {
        console.error('获取模板配置文件失败:', error);
        return null;
      }
    }
    
    async downloadTemplateConfig(templateId) {
      try {
        const configInfo = await this.getTemplateConfig(templateId);
        if (!configInfo || !configInfo.content) {
          throw new Error('配置文件不存在或内容为空');
        }
    
        const blob = new Blob([configInfo.content], { 
          type: configInfo.originalName.endsWith('.json') ? 'application/json' : 'application/javascript' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // 使用原始文件名
        link.download = configInfo.originalName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('下载配置文件失败:', error);
        throw error;
      }
    }

    async getTemplateInfo(templateId) {
      try {
        return await HttpClient.get(`/api/templates/${templateId}/info`);
      } catch (error) {
        console.error('获取模板信息失败:', error);
        return null;
      }
    }

    async updateTemplateInfo(templateId, templateData) {
      try {
        return await HttpClient.put(`/api/templates/${templateId}/info`, templateData);
      } catch (error) {
        console.error('更新模板信息失败:', error);
        throw error;
      }
    }

    async deleteTemplate(templateId) {
      try {
        const response = await HttpClient.delete(`/api/templates/${templateId}`);
        return response;
      } catch (error) {
        console.error('删除模板失败:', error);
        throw error;
      }
    }

    async verifyPassword(templateId, password) {
      try {
        const response = await HttpClient.post(
          `/api/templates/${templateId}/verify`, 
          { password }
        );
        return response;
      } catch (error) {
        console.error('密码验证失败:', error);
        throw error;
      }
    }
}

export default new TemplateService();