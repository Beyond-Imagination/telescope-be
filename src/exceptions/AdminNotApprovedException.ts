import { HttpException } from '@exceptions/HttpException'

export class AdminNotApprovedException extends HttpException {
    constructor() {
        super(403, 'Admin not approved')
        Object.setPrototypeOf(this, AdminNotApprovedException.prototype)
        Error.captureStackTrace(this, AdminNotApprovedException)
    }
}
