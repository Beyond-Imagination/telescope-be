import { Body, Controller, OnUndefined, Post, Req, UseBefore } from 'routing-controllers'
import { issueWebhookValidation, webhookValidation } from '@middlewares/validation.middleware'
import { CodeReviewDTO, IssueDTO, ReactionDTO } from '@dtos/webhooks.dtos'
import { WebhookService } from '@services/webhook.service'
import { Request } from 'express'

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
    async createCodeReview(@Body() payload: CodeReviewDTO, @Req() request: Request) {
        await this.service.handleCodeReviewWebHook(payload, request.axiosOption, true)
    }

    @Post('/code-review/close')
    @OnUndefined(204)
    async closeCodeReview(@Body() payload: CodeReviewDTO, @Req() request: Request) {
        await this.service.handleCodeReviewWebHook(payload, request.axiosOption, false)
    }

    @Post('/message/reaction/add')
    @UseBefore(webhookValidation)
    @OnUndefined(204)
    async addMessageReaction(@Body() payload: ReactionDTO, @Req() request: Request) {
        await this.service.handleAddMessageReactionWebhook(payload, request.axiosOption)
    }

    @Post('/message/reaction/remove')
    @UseBefore(webhookValidation)
    @OnUndefined(204)
    async removeMessageReaction(@Body() payload: ReactionDTO, @Req() request: Request) {
        await this.service.handleRemoveMessageReactionWebhook(payload, request.axiosOption)
    }
}
