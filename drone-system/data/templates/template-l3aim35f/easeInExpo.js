function calculateTransition(t) {
    return (t => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))))(t);
}

module.exports = { calculateTransition };