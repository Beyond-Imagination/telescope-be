import { NextFunction, Request, Response } from 'express'
import { HttpException } from '@exceptions/HttpException'
import { logger } from '@utils/logger'

const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
    try {
        error.status = error.httpCode || error.status || 500
        error.message = error.message || 'Something went wrong'

        logger.error(error)
        res.status(error.status).json({ message: error.message })
    } catch (error) {
        next(error)
    }
}

export default errorMiddleware
