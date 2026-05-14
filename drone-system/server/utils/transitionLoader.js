const fs = require('fs');
const path = require('path');

class TransitionLoader {
    async loadTransition(templateId) {
        try {
            const templatePath = path.join(
                process.cwd(),
                'data',
                'templates',
                `template-${templateId}`
            );

            const files = await fs.promises.readdir(templatePath);
            const jsFile = files.find(file => 
                file.endsWith('.js') && file !== 'info.json'
            );

            if (!jsFile) {
                throw new Error(`找不到过渡模板 ${templateId} 的配置文件`);
            }

            const configPath = path.join(templatePath, jsFile);
            
            // 清除 require 缓存
            const resolvedPath = require.resolve(configPath);
            delete require.cache[resolvedPath];
            
            // 重新导入模块
            const module = require(configPath);
            const { calculateTransition } = module;

            if (typeof calculateTransition !== 'function') {
                throw new Error(`模板 ${templateId} 未提供 calculateTransition 函数`);
            }

            return calculateTransition;
        } catch (error) {
            console.error(`加载过渡函数失败: ${error.message}`);
            throw error;
        }
    }

    async preloadTransitions(templateIds) {
        const loadPromises = templateIds.map(id => this.loadTransition(id));
        await Promise.all(loadPromises);
    }
}

module.exports = new TransitionLoader();