const express = require("express");
const { startScenario, stopScenario, startBaseline, getStatus } = require("./scenarioManager");

const authFailure = require("./scenarios/authFailure");
const latencyDegradation = require("./scenarios/latencyDegradation");
const dbExhaustion = require("./scenarios/dbExhaustion");
const trafficAnomaly = require("./scenarios/trafficAnomaly");
const cascadingFailure = require("./scenarios/cascadingFailure");

const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());

const scenarioMap = {
    "auth-failure": authFailure,
    "latency-degradation": latencyDegradation,
    "db-exhaustion": dbExhaustion,
    "traffic-anomaly": trafficAnomaly,
    "cascading-failure": cascadingFailure
};

app.get("/attack/status", (req, res) => {
    const status = getStatus();
    res.json(status);
});

app.post("/attack/start/:name", (req, res) => {
    const { name } = req.params;
    const scenarioFn = scenarioMap[name];

    if (scenarioFn) {
        try {
            startScenario(name, scenarioFn);
            res.json({ status: "started", scenario: name });
        } catch (err) {
            res.status(409).json({ error: err.message });
        }
    } else {
        res.status(404).json({ error: "Scenario not found" });
    }
});

app.post("/attack/stop/:name", (req, res) => {
    stopScenario(req.params.name);
    res.json({ status: "stopped", scenario: req.params.name });
});

app.listen(4000, () => {
    console.log("Attack backend running on port 4000");
    startBaseline();
});
