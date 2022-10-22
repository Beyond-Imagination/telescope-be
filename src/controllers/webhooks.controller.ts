import { Body, Controller, Post, UseBefore, OnUndefined, Res } from 'routing-controllers'
import { webhookValidation } from '@middlewares/validation.middleware'
import { CodeReviewDTO, UpdateIssueStatusDTO } from '@dtos/webhooks.dtos'
import { WebhookService } from '@services/webhook.service'
import { Response } from 'express'

@Controller('/webhooks')
@UseBefore(webhookValidation)
export class WebhooksController {
    service: WebhookService = new WebhookService()

    @Post('/issue/create')
    createIssue() {
        return 'OK'
    }

    @Post('/issue/update/status')
    @OnUndefined(204)
    async updateIssueStatus(@Body() payload: UpdateIssueStatusDTO) {
        await this.service.updateIssueStatus(payload)
    }

    @Post('/issue/update/assignee')
    updateIssueAssignee() {
        return 'OK'
    }

    @Post('/issue/delete')
    deleteIssue() {
        return 'OK'
    }

    @Post('/code-review/create')
    @OnUndefined(204)
    async createCodeReview(@Body() payload: CodeReviewDTO, @Res() response: Response) {
        await this.service.handleCodeReviewWebHook(payload, response.locals.bearerToken, true)
    }

    @Post('/code-review/close')
    @OnUndefined(204)
    async closeCodeReview(@Body() payload: CodeReviewDTO, @Res() response: Response) {
        await this.service.handleCodeReviewWebHook(payload, response.locals.bearerToken, false)
    }
}
