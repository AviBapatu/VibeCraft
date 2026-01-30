const scenarios = {};
const running = {};

function startScenario(name, scenarioFn) {
    if (running[name]) return;

    const startTime = Date.now();

    running[name] = setInterval(() => {
        const t = Math.floor((Date.now() - startTime) / 1000);
        scenarioFn(t);
    }, 1000);
}

function stopScenario(name) {
    if (!running[name]) return;
    clearInterval(running[name]);
    delete running[name];
}

module.exports = { startScenario, stopScenario };
