function calculateTransition(t) {
    return (t => t * (2 - t))(t);
}

module.exports = { calculateTransition };