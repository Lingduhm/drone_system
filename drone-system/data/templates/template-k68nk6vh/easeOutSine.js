function calculateTransition(t) {
    return (t => Math.sin((t * Math.PI) / 2))(t);
}

module.exports = { calculateTransition };