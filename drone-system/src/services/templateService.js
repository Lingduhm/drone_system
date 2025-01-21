// src/services/templateService.js
import HttpClient from './httpClient';

class TemplateService {
  async getAllTemplates() {
    return HttpClient.get('/api/templates');
  }

  async saveTemplate(templateData) {
    return HttpClient.post('/api/templates', templateData);
  }
}

export default new TemplateService();