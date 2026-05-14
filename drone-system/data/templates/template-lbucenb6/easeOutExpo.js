function calculateTransition(t) {
    return (t => (t === 1 ? 1 : -Math.pow(2, -10 * t) + 1))(t);
}

module.exports = { calculateTransition };