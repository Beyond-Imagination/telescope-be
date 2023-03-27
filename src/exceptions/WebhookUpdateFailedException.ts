import { HttpException } from '@exceptions/HttpException'

export class WebhookUpdateFailedException extends HttpException {
    constructor() {
        super(500, 'Webhook Update failed!!')
        Object.setPrototypeOf(this, WebhookUpdateFailedException.prototype)
        Error.captureStackTrace(this, WebhookUpdateFailedException)
    }
}
