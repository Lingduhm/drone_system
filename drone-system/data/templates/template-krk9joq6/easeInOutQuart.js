function calculateTransition(t) {
    return (t =>
        t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t)(t);
}

module.exports = { calculateTransition };