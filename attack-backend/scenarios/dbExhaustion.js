const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

function getEmissionParams(t) {
    const connections = 20 + t * 0.8;
    let pError = 0.02;
    if (connections > 80) pError = 0.7;
    else if (connections > 60) pError = 0.3;

    return {
        rate: clamp(2 + Math.floor(t / 15), 2, 8),
        latency: 400 + connections * 10,
        pError,
        connections
    };
}

module.exports = function dbExhaustionScenario(t) {
    const { rate, latency, pError, connections } = getEmissionParams(t);

    for (let i = 0; i < rate; i++) {
        const isError = Math.random() < pError;

        emitLog({
            timestamp: new Date().toISOString(),
            service: "database",
            level: isError ? "ERROR" : "INFO",
            message: isError
                ? "Connection pool exhausted"
                : "Query executed successfully",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: "/api/products",
            method: "GET",
            latency_ms: latency,
            status_code: isError ? 503 : 200,
            cpu_pct: clamp(30 + connections * 0.5, 30, 90),
            memory_mb: clamp(200 + connections * 5, 200, 1024),
            error_type: isError ? "CONNECTION_POOL_EXHAUSTED" : null,
            retry_count: null
        });
    }
};
