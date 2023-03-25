import { HttpException } from '@exceptions/HttpException'

export class DuplicateApplicationException extends HttpException {
    constructor() {
        super(409, 'cannot identify target application')
        Object.setPrototypeOf(this, DuplicateApplicationException.prototype)
        Error.captureStackTrace(this, DuplicateApplicationException)
    }
}
