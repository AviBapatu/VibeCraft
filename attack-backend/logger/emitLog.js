const winston = require("winston");

const logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.json()
});

function emitLog(log) {
    logger.log({
        ...log,
        level: log.level.toLowerCase()
    });
}

module.exports = emitLog;
