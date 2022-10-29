import { config } from 'dotenv'

config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

export const CREDENTIALS = process.env.CREDENTIALS === 'true'
export const { NODE_ENV, PORT, SECRET_KEY, DB_URI, DB_NAME, LOG_FORMAT, LOG_DIR, ORIGIN, SERVER_URL, CLIENT_URL } = process.env
export const VERSION = process.env.npm_package_version
