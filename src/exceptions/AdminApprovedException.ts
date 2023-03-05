import { HttpException } from '@exceptions/HttpException'

export class AdminApprovedException extends HttpException {
    constructor() {
        super(400, 'Admin already approved')
        Object.setPrototypeOf(this, AdminApprovedException.prototype)
        Error.captureStackTrace(this, AdminApprovedException)
    }
}
