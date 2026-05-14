function calculateTransition(t) {
    return (t => 1 - --t * t * t * t)(t);
}

module.exports = { calculateTransition };