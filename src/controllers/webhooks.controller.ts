import { Body, Controller, OnUndefined, Post, Res, UseBefore } from 'routing-controllers'
import { webhookValidation, issueWebhookValidation } from '@middlewares/validation.middleware'
import { CodeReviewDTO, IssueDTO } from '@dtos/webhooks.dtos'
import { WebhookService } from '@services/webhook.service'
import { Response } from 'express'

@Controller('/webhooks')
@UseBefore(webhookValidation)
export class WebhooksController {
    service: WebhookService = new WebhookService()

    @Post('/issue/create')
    @OnUndefined(204)
    @UseBefore(issueWebhookValidation)
    async createIssue(@Body() payload: IssueDTO) {
        await this.service.createIssue(payload)
    }

    @Post('/issue/update/status')
    @OnUndefined(204)
    @UseBefore(issueWebhookValidation)
    async updateIssueStatus(@Body() payload: IssueDTO) {
        await this.service.updateIssueStatus(payload)
    }

    @Post('/issue/update/assignee')
    @OnUndefined(204)
    @UseBefore(issueWebhookValidation)
    async updateIssueAssignee(@Body() payload: IssueDTO) {
        await this.service.updateIssueAssignee(payload)
    }

    @Post('/issue/delete')
    @OnUndefined(204)
    @UseBefore(issueWebhookValidation)
    async deleteIssue(@Body() payload: IssueDTO) {
        await this.service.deleteIssue(payload)
    }

    @Post('/code-review/create')
    @OnUndefined(204)
    async createCodeReview(@Body() payload: CodeReviewDTO, @Res() response: Response) {
        await this.service.handleCodeReviewWebHook(payload, response.locals.axiosOption, true)
    }

    @Post('/code-review/close')
    @OnUndefined(204)
    async closeCodeReview(@Body() payload: CodeReviewDTO, @Res() response: Response) {
        await this.service.handleCodeReviewWebHook(payload, response.locals.axiosOption, false)
    }
}
