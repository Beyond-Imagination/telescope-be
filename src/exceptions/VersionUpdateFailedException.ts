import { HttpException } from '@exceptions/HttpException'

export class VersionUpdateFailedException extends HttpException {
    constructor(cause: Object) {
        super(500, `version update failed \n [cause]: ${JSON.stringify(cause)}`)
        Object.setPrototypeOf(this, VersionUpdateFailedException.prototype)
        Error.captureStackTrace(this, VersionUpdateFailedException)
    }
}
