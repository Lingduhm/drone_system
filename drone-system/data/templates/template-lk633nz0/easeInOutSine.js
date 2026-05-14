function calculateTransition(t) {
    return (t => -(Math.cos(Math.PI * t) - 1) / 2)(t);
}

module.exports = { calculateTransition };