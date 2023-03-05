import { HttpException } from '@exceptions/HttpException'

export class AdminNotFoundException extends HttpException {
    constructor() {
        super(404, 'Admin not found')
        Object.setPrototypeOf(this, AdminNotFoundException.prototype)
        Error.captureStackTrace(this, AdminNotFoundException)
    }
}
