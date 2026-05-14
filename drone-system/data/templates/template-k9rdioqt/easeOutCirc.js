function calculateTransition(t) {
    return (t => Math.sqrt(1 - --t * t))(t);
}

module.exports = { calculateTransition };