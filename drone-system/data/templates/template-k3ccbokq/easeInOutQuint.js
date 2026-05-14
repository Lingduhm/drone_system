function calculateTransition(t) {
    return (t =>
        t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t)(t);
}

module.exports = { calculateTransition };