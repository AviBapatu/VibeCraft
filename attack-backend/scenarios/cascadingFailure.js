const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

function getEmissionParams(t) {
    let phase, service, pError, latency, rate;

    // Phase 1: service-a fails (0-45s)
    if (t < 45) {
        phase = 1;
        service = "service-a";
        pError = 0.6;
        latency = 1400;
        rate = 5;
    }
    // Phase 2: spreads to service-b (45-90s)
    else if (t < 90) {
        phase = 2;
        service = "service-b";
        pError = 0.4;
        latency = 1800;
        rate = 4;
    }
    // Phase 3: spreads to service-c (90s+)
    else {
        phase = 3;
        service = "service-c";
        pError = 0.7;
        latency = 2800;
        rate = 6;
    }

    return {
        rate,
        latency,
        pError,
        service,
        phase
    };
}

module.exports = function cascadingFailureScenario(t) {
    const { rate, latency, pError, service, phase } = getEmissionParams(t);

    for (let i = 0; i < rate; i++) {
        const isError = Math.random() < pError;

        emitLog({
            timestamp: new Date().toISOString(),
            service: service,
            level: isError ? "ERROR" : "INFO",
            message: isError
                ? `Upstream timeout from ${phase === 1 ? "external-api" : "service-" + String.fromCharCode(96 + phase)}`
                : "Response received",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: "/api/process",
            method: "POST",
            latency_ms: latency,
            status_code: isError ? 502 : 200,
            cpu_pct: clamp(30 + phase * 15 + rate * 2, 30, 85),
            memory_mb: null,
            error_type: isError ? "UPSTREAM_TIMEOUT" : null,
            retry_count: null
        });
    }
};
