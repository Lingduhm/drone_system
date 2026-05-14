function calculateTransition(t) {
    return (t => --t * t * t + 1)(t);
}

module.exports = { calculateTransition };