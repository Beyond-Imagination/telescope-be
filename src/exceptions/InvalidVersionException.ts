import { HttpException } from '@exceptions/HttpException'

export class InvalidVersionException extends HttpException {
    constructor() {
        super(400, 'invalid version')
        Object.setPrototypeOf(this, InvalidVersionException.prototype)
        Error.captureStackTrace(this, InvalidVersionException)
    }
}
