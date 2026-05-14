const { createNoise2D } = require('simplex-noise');

/**
 * 风型矩阵生成函数
 * @param {number} width - 矩阵宽度
 * @param {number} height - 矩阵高度
 * @param {...number} params - 可变参数，最后一个用于默认PWM计算，其他用于矩阵生成
 * @returns {Object} 包含原始矩阵和默认PWM值的对象
 */
async function generateWindMatrix(width, height, ...params) {
    
    const noise2D = createNoise2D();
    const matrix = [];
    
    // 获取用于默认PWM计算的参数（最后一个参数）
    const defaultPwmParam = params[params.length - 1];
    
    // 其他参数用于影响矩阵生成
    const scaleParams = params.slice(0, -1).map(param => param / 100000);
    
    // 生成原始噪声矩阵
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // 使用多个参数影响噪声生成
            let noiseValue = 0;
            scaleParams.forEach((scale, index) => {
                // 使用不同的缩放和偏移来叠加噪声
                noiseValue += noise2D(x * scale + index * 1000, y * scale + index * 1000) 
                    * (1 / Math.pow(2, index)); // 后面的参数影响越来越小
            });
            // 归一化叠加的噪声值
            noiseValue = noiseValue / scaleParams.reduce((sum, _, i) => sum + 1 / Math.pow(2, i), 0);
            row.push(noiseValue);
        }
        matrix.push(row);
    }

    // 计算默认的PWM值
    const defaultPWMValue = Math.floor((defaultPwmParam / 100000) * 255);
    
    return {
        matrix: matrix,
        defaultPWMValue: defaultPWMValue
    };
}

module.exports = { generateWindMatrix };