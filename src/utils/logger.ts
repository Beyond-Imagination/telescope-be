import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import winston from 'winston'
import winstonDaily from 'winston-daily-rotate-file'
import expressWinston from 'express-winston'
import { LOG_DIR } from '@config'

// logs dir
const logDir: string = join(__dirname, LOG_DIR)

if (!existsSync(logDir)) {
    mkdirSync(logDir)
}

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const winstonOption = {
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint(),
    ),
    transports: [
        // debug log setting
        new winstonDaily({
            level: 'debug',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/debug', // log file /logs/debug/*.log in save
            filename: `%DATE%.log`,
            maxFiles: 30, // 30 Days saved
            json: false,
            zippedArchive: false,
        }),
        // error log setting
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/error', // log file /logs/error/*.log in save
            filename: `%DATE%.log`,
            maxFiles: 30, // 30 Days saved
            handleExceptions: true,
            json: false,
            zippedArchive: false,
            format: winston.format.errors({ stack: true }),
        }),
        new winston.transports.Console(),
    ],
}

const loggerMiddleware = expressWinston.logger({
    ...winstonOption,
    requestWhitelist: ['headers.origin', 'body', 'query'],
    responseWhitelist: ['body'],
})

const logger = winston.createLogger(winstonOption)

export { logger, loggerMiddleware }
