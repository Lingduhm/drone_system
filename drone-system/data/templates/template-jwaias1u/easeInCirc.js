function calculateTransition(t) {
    return (t => 1 - Math.sqrt(1 - t * t))(t);
}

module.exports = { calculateTransition };