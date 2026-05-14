// src/services/baseService.js
export default class BaseService {
  constructor(storageKey) {
    this.storageKey = storageKey
  }

  async getAll() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`获取${this.storageKey}数据失败:`, error)
      return []
    }
  }

  async save(items) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items))
    } catch (error) {
      console.error(`保存${this.storageKey}数据失败:`, error)
      throw error
    }
  }
}