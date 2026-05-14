function calculateTransition(t) {
    return (t =>
        t < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2)(t);
}

module.exports = { calculateTransition };