function calculateTransition(t) {
    return (t => {
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0
            ? 0
            : t === 1
            ? 1
            : t < 0.5
            ? -(
                  Math.pow(2, 20 * t - 10) *
                  Math.sin((20 * t - 11.125) * c5)
              ) / 2
            : (Math.pow(2, -20 * t + 10) *
                  Math.sin((20 * t - 11.125) * c5)) /
                  2 +
              1;
    })(t);
}

module.exports = { calculateTransition };