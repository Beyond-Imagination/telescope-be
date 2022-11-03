import { HttpException } from '@exceptions/HttpException'

export class InvalidRequestException extends HttpException {
    constructor() {
        super(401, 'Invalid request')
        Object.setPrototypeOf(this, InvalidRequestException.prototype)
        Error.captureStackTrace(this, InvalidRequestException)
    }
}
