// src/services/httpClient.js
const BASE_URL = `http://${window.location.hostname}:3000`;

class HttpClient {
  static async request(endpoint, options = {}) {
    console.log('Making request to:', `${BASE_URL}${endpoint}`, options); // 添加调试日志
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

  // 添加 PUT 方法
  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
  }

  static async uploadFile(endpoint, formData) {
    console.log('正在上传文件到:', endpoint); // 添加调试日志
    return this.request(endpoint, {
      method: 'POST',
      body: formData // 不要设置 Content-Type，让浏览器自动设置
    });
  }
  
  static async download(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response.text(); // 返回文本内容
  }

  static async downloadFile(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response.blob();
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

export default HttpClient;