const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");
const random = require("../utils/random");

function getEmissionParams(t) {
    return {
        rate: clamp(5 + Math.floor(t / 10), 5, 15),
        latency: 200 + random(0, 100),
        pError: 0.01
    };
}

module.exports = function trafficAnomalyScenario(t) {
    const { rate, latency, pError } = getEmissionParams(t);

    for (let i = 0; i < rate; i++) {
        const isError = Math.random() < pError;
        const isSuspicious = Math.random() < 0.8;
        const ip = isSuspicious
            ? `192.168.1.${random(1, 255)}`
            : faker.internet.ip();

        emitLog({
            timestamp: new Date().toISOString(),
            service: "frontend",
            level: isError ? "ERROR" : "INFO",
            message: isError ? "Internal Server Error" : "Page loaded",
            request_id: uuid(),
            ip: ip,
            endpoint: "/",
            method: "GET",
            latency_ms: latency,
            status_code: isError ? 500 : 200,
            cpu_pct: clamp(10 + rate * 2, 10, 50),
            memory_mb: null,
            error_type: isError ? "INTERNAL_SERVER_ERROR" : null,
            retry_count: null
        });
    }
};
