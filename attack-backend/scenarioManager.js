const baselineEmitter = require("./scenarios/baselineEmitter");
const { setActiveScenario, getActiveScenario } = require("./attackState");

const scenarios = {};
const running = {};
let baselineInterval = null;

// Track active scenario state for UI persistence
let startedAt = null;

function startBaseline() {
    if (baselineInterval || Object.keys(running).length > 0) return;

    console.log("Starting baseline emitter...");
    setActiveScenario("baseline");
    baselineInterval = setInterval(() => {
        baselineEmitter();
    }, 1000);
}

function stopBaseline() {
    if (baselineInterval) {
        console.log("Stopping baseline emitter...");
        clearInterval(baselineInterval);
        baselineInterval = null;
        if (getActiveScenario() === "baseline") {
            setActiveScenario(null);
        }
    }
}


function startScenario(name, scenarioFn) {
    const currentScenario = getActiveScenario();
    if (currentScenario && currentScenario !== "baseline" && currentScenario !== name) {
        throw new Error(`Scenario '${currentScenario}' is already running`);
    }

    if (running[name]) return;

    stopBaseline();

    // Set source of truth
    setActiveScenario(name);
    startedAt = Date.now();

    // The legacy running object tracks the interval ID, which is an implementation detail
    // activeScenario/startedAt tracks the conceptual "what is happening"
    running[name] = setInterval(() => {
        const t = Math.floor((Date.now() - startedAt) / 1000);
        scenarioFn(t);
    }, 1000);
}

function stopScenario(name) {
    if (running[name]) {
        clearInterval(running[name]);
        delete running[name];
    }

    // Clear source of truth if this was the active one
    // Also ensures we clean up any potential "ghost" scenarios if state got desynced
    const currentScenario = getActiveScenario();
    if (currentScenario === name || currentScenario) {
        // Safety: clear ALL running intervals just in case
        Object.keys(running).forEach(key => {
            clearInterval(running[key]);
            delete running[key];
        });

        setActiveScenario(null);
        startedAt = null;
    }

    if (Object.keys(running).length === 0) {
        startBaseline();
    }
}

function getStatus() {
    const currentScenario = getActiveScenario();
    if (!currentScenario || currentScenario === "baseline") return null;

    return {
        scenario: currentScenario,
        started_at: startedAt
    };
}

module.exports = { startScenario, stopScenario, startBaseline, getStatus };
