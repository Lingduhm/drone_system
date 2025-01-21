// src/utils/index.js
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const handleError = (error) => {
  console.error('操作失败:', error)
  throw error
}