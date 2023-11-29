import { NextFunction, Request, Response } from 'express'
import { getDaysBefore } from '@utils/date'
import moment from 'moment-timezone'

export const setFromToDate = fromDefault => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const from = req.query.from ? new Date(<string>req.query.from) : getDaysBefore(fromDefault)
        const to = req.query.to ? new Date(<string>req.query.to) : new Date()

        const tz = req.query.timezone ? <string>req.query.timezone : 'Etc/UTC'

        const fromDate = moment(from).tz(tz).startOf('day').toDate()
        const toDate = moment(to).tz(tz).endOf('day').toDate()
        req.fromDate = fromDate
        req.toDate = toDate
        next()
    } catch (e) {
        next(e)
    }
}
