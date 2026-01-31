const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");
const random = require("../utils/random");

function getEmissionParams(t) {
    return {
        rate: clamp(50 + Math.floor(t / 1.5), 50, 250), // Faster ramp (50-250 RPS)
        latency: 200 + random(0, 100),
        pError: 0.008 // Very low error rate - infrastructure handling it
    };
}

module.exports = function trafficAnomalyScenario(t) {
    const { rate, latency, pError } = getEmissionParams(t);

    for (let i = 0; i < rate; i++) {
        const isError = Math.random() < pError;
        // Stronger clustering - 90% from narrow range
        const isSuspicious = Math.random() < 0.90;
        const ip = isSuspicious
            ? `192.168.1.${random(1, 50)}` // Narrower IP range
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
            cpu_pct: clamp(10 + rate * 0.25, 10, 60), // CPU grows with load
            memory_mb: null,
            error_type: isError ? "INTERNAL_SERVER_ERROR" : null,
            retry_count: null
        });
    }
};
