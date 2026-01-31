
let activeScenario = null;

module.exports = {
    getActiveScenario: () => activeScenario,
    setActiveScenario: (name) => { activeScenario = name; }
};
