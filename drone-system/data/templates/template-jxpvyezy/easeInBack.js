function calculateTransition(t) {
    return (t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    })(t);
}

module.exports = { calculateTransition };