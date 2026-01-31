const winston = require("winston");

const logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.json()
});

function sendToConsole(log) {
    logger.log({
        ...log,
        level: log.level.toLowerCase()
    });
}

async function sendToMonitoring(log) {
    try {
        const axios = require("axios");
        const monitoringUrl = process.env.MONITORING_BACKEND_URL || "http://localhost:5000";
        await axios.post(`${monitoringUrl}/ingest/log`, log);
    } catch (err) {
        // Silently fail for now as per instructions (or maybe simple console error if needed, but "No retries yet" implies fire and forget)
        // User said: "That’s it. No retries yet. No batching yet."
        // I'll add a minimal catch to prevent crashing the attack backend if monitoring is down.
    }
}

const { getActiveScenario } = require("../attackState");

function emitLog(log) {
    const enrichedLog = {
        ...log,
        scenario: getActiveScenario()
    };
    sendToConsole(enrichedLog);
    sendToMonitoring(enrichedLog);
}

module.exports = emitLog;
