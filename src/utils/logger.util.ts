import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize, errors, json } = format;

import { env } from "../utils/env.util";

// Custom log format for console (colored & readable)
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Determine log level from env or default
const logLevel = env.NODE_ENV === "production" ? "info" : "debug";

export const logger = createLogger({
  level: logLevel,
  format: combine(
    errors({ stack: true }), // Show full error stack
    timestamp(),
    json() // Log in JSON format for files
  ),
  transports: [
    // Write all logs error and above to error.log
    new transports.File({ filename: "logs/error.log", level: "error" }),

    // Write all logs to combined.log
    new transports.File({ filename: "logs/combined.log" }),

    // Also log to console with color and simple format in dev
    new transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});
