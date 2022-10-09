import { HttpException } from '@exceptions/HttpException'

export class WrongClassNameException extends HttpException {
    constructor() {
        super(403, 'Wrong className')
    }
}
