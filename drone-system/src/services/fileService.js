import HttpClient from './httpClient';

class FileService {
  async uploadTestFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return HttpClient.request('/api/upload/test/csv', {
      method: 'POST',
      body: formData
    });
  }

  async uploadFragmentFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return HttpClient.request('/api/upload/fragment/csv', {
      method: 'POST',
      body: formData
    });
  }

  async uploadDocument(type, id, file, templateType = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', 'document');
    
    let url = `/api/upload/${type}/${id}`;
    if (templateType) {
      url += `?templateType=${encodeURIComponent(templateType)}`;
    }
    
    return HttpClient.request(url, {
      method: 'POST',
      body: formData
    });
  }

  async uploadConfig(type, id, file, templateType = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', 'config');
    
    let url = `/api/upload/${type}/${id}`;
    if (templateType) {
      url += `?templateType=${encodeURIComponent(templateType)}`;
    }

    return HttpClient.request(url, {
      method: 'POST',
      body: formData
    });
  }

  async getFileList(type) {
    return HttpClient.get(`/api/files/${type}`);
  }
}

export default new FileService();