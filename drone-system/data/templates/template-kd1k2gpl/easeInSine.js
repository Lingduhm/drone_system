function calculateTransition(t) {
    return (t => 1 - Math.cos((t * Math.PI) / 2))(t);
}

module.exports = { calculateTransition };