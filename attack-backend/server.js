const express = require("express");
const { startScenario, stopScenario } = require("./scenarioManager");

const authFailure = require("./scenarios/authFailure");
// later: require other scenarios

const app = express();
app.use(express.json());

app.post("/attack/start/:name", (req, res) => {
    const { name } = req.params;

    if (name === "auth-failure") {
        startScenario(name, authFailure);
    }

    res.json({ status: "started", scenario: name });
});

app.post("/attack/stop/:name", (req, res) => {
    stopScenario(req.params.name);
    res.json({ status: "stopped", scenario: req.params.name });
});

app.listen(4000, () =>
    console.log("Attack backend running on port 4000")
);
