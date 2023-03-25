import { HttpException } from '@exceptions/HttpException'

export class NotFoundApplicationException extends HttpException {
    constructor() {
        super(404, 'cannot identify target application')
        Object.setPrototypeOf(this, NotFoundApplicationException.prototype)
        Error.captureStackTrace(this, NotFoundApplicationException)
    }
}
