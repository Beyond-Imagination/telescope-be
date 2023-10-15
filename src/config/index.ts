import { config } from 'dotenv'
import { version } from '../../package.json'

config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

export const CREDENTIALS = process.env.CREDENTIALS === 'true'
export const { NODE_ENV, PORT, SECRET_KEY, DB_URI, DB_NAME, LOG_FORMAT, LOG_DIR, ORIGIN, SERVER_URL, CLIENT_URL } = process.env
export const VERSION = version
export const PM_ID = process.env.pm_id

export const BOTTLENECK_MAX_CONCURRENT = parseInt(process.env.BOTTLENECK_MAX_CONCURRENT) || 5
export const BOTTLENECK_MIN_TIME = parseInt(process.env.BOTTLENECK_MIN_TIME) || 100
