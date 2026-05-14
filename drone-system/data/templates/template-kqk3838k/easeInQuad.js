function calculateTransition(t) {
    return (t => t * t)(t);
}

module.exports = { calculateTransition };