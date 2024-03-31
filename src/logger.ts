import { createLogger, format, transports } from "winston";

// Levels defaults to npm logging levels
// { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 }
// They can be set per transport or globally, it will log all levels from 0 to the specified level
export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console(), new transports.File({ filename: "crawler.log", level: "silly" })],
});
