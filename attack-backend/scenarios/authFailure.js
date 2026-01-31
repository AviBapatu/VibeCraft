const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

function getEmissionParams(t) {
    const pError = clamp(0.02 + (t / 120) * 0.6, 0.02, 0.6);
    return {
        rate: 3, // Fix 1: Flat rate
        latency: 300 + clamp(t * 8, 0, 300), // Fix 1: 300 -> 600ms max
        pError,
        retryCount: Math.min(2, Math.floor(t / 60)) // Fix 1: Cap retries
    };
}

module.exports = function authFailureScenario(t) {
    const { rate, latency, pError, retryCount } = getEmissionParams(t);

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
