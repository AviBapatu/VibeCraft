const baselineEmitter = require("./scenarios/baselineEmitter");

const scenarios = {};
const running = {};
let baselineInterval = null;

function startBaseline() {
    if (baselineInterval || Object.keys(running).length > 0) return;

    console.log("Starting baseline emitter...");
    baselineInterval = setInterval(() => {
        baselineEmitter();
    }, 1000);
}

function stopBaseline() {
    if (baselineInterval) {
        console.log("Stopping baseline emitter...");
        clearInterval(baselineInterval);
        baselineInterval = null;
    }
}

function startScenario(name, scenarioFn) {
    if (running[name]) return;

    stopBaseline();

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

    if (Object.keys(running).length === 0) {
        startBaseline();
    }
}

module.exports = { startScenario, stopScenario, startBaseline };
