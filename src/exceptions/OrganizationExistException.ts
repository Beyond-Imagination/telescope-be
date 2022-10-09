import { HttpException } from '@exceptions/HttpException'

export class OrganizationExistException extends HttpException {
    constructor() {
        super(403, 'This organization already exists!')
    }
}
