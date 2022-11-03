import { HttpException } from '@exceptions/HttpException'

export class OrganizationNotFoundException extends HttpException {
    constructor() {
        super(404, 'Organization not found')
        Object.setPrototypeOf(this, OrganizationNotFoundException.prototype)
        Error.captureStackTrace(this, OrganizationNotFoundException)
    }
}
