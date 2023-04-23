import { HttpException } from '@exceptions/HttpException'

export class WrongServerUrlException extends HttpException {
    constructor() {
        super(403, 'Invalid ServerURL')
        Object.setPrototypeOf(this, WrongServerUrlException.prototype)
        Error.captureStackTrace(this, WrongServerUrlException)
    }
}
