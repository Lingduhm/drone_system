// src/services/experimentService.js
import { STORAGE_KEYS } from '@/constants'
import { generateId } from '@/utils'
import BaseService from './baseService'

class ExperimentService extends BaseService {
  constructor() {
    super(STORAGE_KEYS.EXPERIMENTS)
  }

  async getExperimentsByProject(projectId) {
    const experiments = await this.getAll()
    return experiments.filter(exp => exp.projectId === projectId)
  }

  async saveExperiment(experimentData) {
    const experiments = await this.getAll()
    const newExperiment = {
      ...experimentData,
      id: generateId(),
      time: new Date().toISOString(),
      selected: false
    }
    experiments.unshift(newExperiment)
    await this.save(experiments)
    return newExperiment
  }

  async toggleExperimentSelect(id) {
    const experiments = await this.getAll()
    const index = experiments.findIndex(e => e.id === id)
    if (index === -1) throw new Error('实验不存在')
    
    experiments[index].selected = !experiments[index].selected
    await this.save(experiments)
    return experiments[index]
  }
}

export default new ExperimentService()