// src/services/fragmentService.js
import { STORAGE_KEYS } from '@/constants'
import { generateId, formatDate } from '@/utils'
import BaseService from './baseService'

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
}

export default new FragmentService()