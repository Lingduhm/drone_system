function calculateTransition(t) {
    return (t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
            ? 0
            : t === 1
            ? 1
            : -Math.pow(2, 10 * t - 10) *
              Math.sin((t * 10 - 10.75) * c4);
    })(t);
}

module.exports = { calculateTransition };