// src/services/fileService.js
import HttpClient from './httpClient';

class FileService {
    // 上传片段配置文件
    async uploadFragmentConfig(projectId, fragmentId, type, file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        return await HttpClient.uploadFile(
          `/api/projects/${projectId}/fragments/${fragmentId}/csv/${type}`, 
          formData
        );
      } catch (error) {
        console.error('上传配置文件失败:', error);
        throw error;
      }
    }

    async uploadTestFile(formData) {
      try {
        // 修改上传路径，与后端路由匹配
        return await HttpClient.uploadFile('/api/test/csv/upload', formData);
      } catch (error) {
        console.error('上传测试文件失败:', error);
        throw error;
      }
    }
  
    async downloadTestFile(filename) {
      try {
        const response = await fetch(`http://${window.location.hostname}:3000/api/test/csv/download/${filename}`);        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        
        // 创建下载链接
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // 提取原始文件名
        const originalName = filename.split('-').slice(1).join('-');
        link.setAttribute('download', originalName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('下载测试文件失败:', error);
        throw error;
      }
    }

    async uploadAndProcessWindCSV(formData) {
      try {
        // 添加错误处理和重试逻辑
        const uploadResult = await this.retryRequest(async () => {
          return await HttpClient.uploadFile('/api/test/csv/upload', formData);
        });
        
        if (uploadResult.success) {
          const processResult = await this.retryRequest(async () => {
            return await HttpClient.post(`/api/wind/process/${uploadResult.filename}`);
          });
          
          if (processResult.success) {
            const processedContent = await HttpClient.get(`/api/wind/processed/${uploadResult.filename}`);
            
            return {
              success: true,
              originalFile: uploadResult.filename,
              processedFile: processResult.outputFile,
              processedContent: processedContent.content
            };
          }
        }
        throw new Error('文件上传或处理失败');
      } catch (error) {
        console.error('上传或处理文件失败:', error);
        throw error;
      }
    }

    async retryRequest(requestFn, maxRetries = 3) {
      let lastError;
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await requestFn();
        } catch (error) {
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 指数退避
        }
      }
      throw lastError;
    }

async processFragmentConfig(projectId, fragmentId) {
  try {
    const response = await HttpClient.post(`/api/wind/fragment/${projectId}/${fragmentId}/process`);
    
    if (response.success) {
      // 获取处理后的文件内容
      const processedContent = await HttpClient.get(
        `/api/wind/fragment/${projectId}/${fragmentId}/processed/${response.outputFile}`
      );
      
      return {
        success: true,
        processedFile: response.outputFile,
        processedContent: processedContent.content
      };
    }
    throw new Error('文件处理失败');
  } catch (error) {
    console.error('处理片段配置文件失败:', error);
    throw error;
  }
}

async processFragmentFile(csvPath, fragmentId, projectId, templateId, forceProcess = false) {
  try {
    // 使用完整的绝对路径
    const fullCsvPath = `data/csv_files/fragment/${csvPath.split('/').pop()}`; // 确保只取文件名部分
    const response = await HttpClient.post('/api/wind/fragment/process', { 
      csvPath: fullCsvPath,
      fragmentId,
      projectId,
      templateId,
      forceProcess
    });
    
    if (response.success) {
      return {
        success: true,
        processedFile: response.outputFile
      };
    }
    throw new Error(response.message || '处理失败');
  } catch (error) {
    console.error('处理片段文件失败:', error);
    throw error;
  }
}
}

export default new FileService();