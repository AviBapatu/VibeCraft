const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const clamp = require("../utils/clamp");

function getEmissionParams(t) {
    // More aggressive error rate ramp for clear auth failure
    const pError = clamp(0.02 + (t / 100) * 0.7, 0.02, 0.7);
    return {
        rate: 3, // Steady request rate - not amplifying
        latency: 300 + clamp(t * 5, 0, 250), // Moderate latency increase (300-550ms)
        pError,
        retryCount: Math.min(2, Math.floor(t / 60)) // Cap retries at 2
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
                ? "JWT verification failed - invalid signature or expired token"
                : "Authentication successful",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: "/api/login",
            method: "POST",
            latency_ms: latency + (isError ? 50 : 0), // Errors slightly slower
            status_code: isError ? 401 : 200,
            cpu_pct: clamp(40 + t * 0.4, 40, 85),
            memory_mb: null,
            error_type: isError ? "JWT_VERIFICATION_FAILED" : null,
            retry_count: isError ? retryCount : null
        });
    }
};
