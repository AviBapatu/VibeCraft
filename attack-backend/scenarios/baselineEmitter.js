const { v4: uuid } = require("uuid");
const { faker } = require("@faker-js/faker");
const emitLog = require("../logger/emitLog");
const random = require("../utils/random");

const SERVICES = [
    { name: "auth", endpoint: "/api/login", method: "POST" },
    { name: "database", endpoint: "/api/products", method: "GET" },
    { name: "payment", endpoint: "/api/pay", method: "POST" },
    { name: "frontend", endpoint: "/", method: "GET" }
];

module.exports = function baselineEmitter() {
    SERVICES.forEach(service => {
        emitLog({
            timestamp: new Date().toISOString(),
            service: service.name,
            level: "INFO",
            message: "Operation successful",
            request_id: uuid(),
            ip: faker.internet.ip(),
            endpoint: service.endpoint,
            method: service.method,
            latency_ms: random(20, 50),
            status_code: 200,
            cpu_pct: random(10, 30),
            memory_mb: random(100, 300),
            error_type: null,
            retry_count: null
        });
    });
};
