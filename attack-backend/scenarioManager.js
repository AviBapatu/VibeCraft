const baselineEmitter = require("./scenarios/baselineEmitter");

const scenarios = {};
const running = {};
let baselineInterval = null;

// Track active scenario state for UI persistence
let activeScenario = null;
let startedAt = null;

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

    // Set source of truth
    activeScenario = name;
    startedAt = Date.now();

    // The legacy running object tracks the interval ID, which is an implementation detail
    // activeScenario/startedAt tracks the conceptual "what is happening"
    running[name] = setInterval(() => {
        const t = Math.floor((Date.now() - startedAt) / 1000);
        scenarioFn(t);
    }, 1000);
}

function stopScenario(name) {
    if (!running[name]) return;
    clearInterval(running[name]);
    delete running[name];

    // Clear source of truth if this was the active one
    if (activeScenario === name) {
        activeScenario = null;
        startedAt = null;
    }

    if (Object.keys(running).length === 0) {
        startBaseline();
    }
}

function getStatus() {
    if (!activeScenario) return null;

    return {
        scenario: activeScenario,
        started_at: startedAt
    };
}

module.exports = { startScenario, stopScenario, startBaseline, getStatus };
