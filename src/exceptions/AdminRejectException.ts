import { HttpException } from '@exceptions/HttpException'

export class AdminRejectException extends HttpException {
    constructor() {
        super(400, "You can't reject yourself.")
        Object.setPrototypeOf(this, AdminRejectException.prototype)
        Error.captureStackTrace(this, AdminRejectException)
    }
}
