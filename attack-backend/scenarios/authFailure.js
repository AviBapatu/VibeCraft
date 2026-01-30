const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

module.exports = function authFailureScenario(t) {
    const rate = clamp(1 + Math.floor(t / 20), 1, 10);
    const latency = 300 + t * 8;
    const pError = clamp(0.02 + (t / 120) * 0.6, 0.02, 0.6);
    const retryCount = Math.floor(t / 30);

    for (let i = 0; i < rate; i++) {
        const isError = Math.random() < pError;

        emitLog({
            timestamp: new Date().toISOString(),
            service: "auth",
            level: isError ? "ERROR" : "INFO",
            message: isError
                ? "JWT verification failed"
                : "Authentication successful",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: "/api/login",
            method: "POST",
            latency_ms: latency,
            status_code: isError ? 401 : 200,
            cpu_pct: clamp(40 + t * 0.4, 40, 95),
            memory_mb: null,
            error_type: isError ? "JWT_VERIFICATION_FAILED" : null,
            retry_count: isError ? retryCount : null
        });
    }
};
