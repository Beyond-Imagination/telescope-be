import { HttpException } from '@exceptions/HttpException'

export class AdminExistException extends HttpException {
    constructor() {
        super(400, 'Admin is exist')
        Object.setPrototypeOf(this, AdminExistException.prototype)
        Error.captureStackTrace(this, AdminExistException)
    }
}
