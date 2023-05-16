import { NextFunction, Request, Response } from 'express'
import { HttpException } from '@exceptions/HttpException'

const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
    try {
        res.error = [error]

        error.status = error.httpCode || error.status || 500
        error.message = error.message || 'internal server error'

        res.status(error.status).json({ message: error.message })
    } catch (err) {
        res.error.push(err)
        res.status(500).json({ message: 'internal server error' })
    }
}

export default errorMiddleware
