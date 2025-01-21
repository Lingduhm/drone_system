// src/services/httpClient.js
const BASE_URL = 'http://localhost:3000';

class HttpClient {
  static async request(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response.json();
  }

  static async get(endpoint) {
    return this.request(endpoint);
  }

  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
  }

  static async uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(endpoint, {
      method: 'POST',
      body: formData
    });
  }
}

export default HttpClient;