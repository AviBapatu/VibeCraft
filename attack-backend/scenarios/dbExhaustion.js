const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

function getEmissionParams(t) {
    const connections = 20 + t * 0.9; // Faster connection growth
    let pError = 0.02;

    // Stepped error rate based on connection thresholds
    if (connections > 85) pError = 0.75; // Critical exhaustion
    else if (connections > 70) pError = 0.55; // Severe
    else if (connections > 55) pError = 0.25; // Warning

    return {
        rate: clamp(2 + Math.floor(t / 15), 2, 8),
        latency: 400 + connections * 12, // More dramatic latency increase
        pError,
        connections: Math.floor(connections)
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
                ? `Connection pool exhausted (${connections}/100 active connections)`
                : "Query executed successfully",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: "/api/products",
            method: "GET",
            latency_ms: isError ? latency * 1.5 : latency, // Errors are much slower
            status_code: isError ? 503 : 200,
            cpu_pct: clamp(30 + connections * 0.6, 30, 95),
            memory_mb: clamp(200 + connections * 8, 200, 1500),
            error_type: isError ? "CONNECTION_POOL_EXHAUSTED" : null,
            retry_count: null
        });
    }
};
