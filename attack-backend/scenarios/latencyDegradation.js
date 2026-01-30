const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

function getEmissionParams(t) {
    const isHighError = t > 120;
    return {
        rate: 1,
        latency: 200 + t * 10,
        pError: isHighError ? 0.1 : 0.01
    };
}

module.exports = function latencyDegradationScenario(t) {
    const { rate, latency, pError } = getEmissionParams(t);

    for (let i = 0; i < rate; i++) {
        const isError = Math.random() < pError;

        emitLog({
            timestamp: new Date().toISOString(),
            service: "payment",
            level: isError ? "ERROR" : "INFO",
            message: isError
                ? "Payment gateway timeout"
                : "Payment processed successfully",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: "/api/pay",
            method: "POST",
            latency_ms: latency,
            status_code: isError ? 504 : 200,
            cpu_pct: clamp(20 + t * 0.1, 20, 60),
            memory_mb: null,
            error_type: isError ? "GATEWAY_TIMEOUT" : null,
            retry_count: null
        });
    }
};
