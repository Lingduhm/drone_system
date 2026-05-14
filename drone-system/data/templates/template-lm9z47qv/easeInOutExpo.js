function calculateTransition(t) {
    return (t =>
        t === 0
            ? 0
            : t === 1
            ? 1
            : t < 0.5
            ? Math.pow(2, 20 * t - 10) / 2
            : (2 - Math.pow(2, -20 * t + 10)) / 2)(t);
}

module.exports = { calculateTransition };