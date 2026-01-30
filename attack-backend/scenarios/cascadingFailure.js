const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

function getEmissionParams(t) {
    let phase, service, pError, latency, rate;

    if (t < 40) {
        phase = 1;
        service = "service-a";
        pError = 0.5;
        latency = 1200;
        rate = 5;
    } else if (t < 90) {
        phase = 2;
        service = "service-b";
        pError = 0.2;
        latency = 1500;
        rate = 4;
    } else {
        phase = 3;
        service = "service-c";
        pError = 0.6;
        latency = 2500;
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
    const { rate, latency, pError, service } = getEmissionParams(t);

    for (let i = 0; i < rate; i++) {
        const isError = Math.random() < pError;

        emitLog({
            timestamp: new Date().toISOString(),
            service: service,
            level: isError ? "ERROR" : "INFO",
            message: isError ? "Upstream timeout" : "Response received",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: "/api/process",
            method: "POST",
            latency_ms: latency,
            status_code: isError ? 502 : 200,
            cpu_pct: clamp(30 + rate * 3, 30, 80),
            memory_mb: null,
            error_type: isError ? "UPSTREAM_TIMEOUT" : null,
            retry_count: null
        });
    }
};
