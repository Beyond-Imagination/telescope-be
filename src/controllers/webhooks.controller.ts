import { Body, Controller, Post, UseBefore, OnUndefined } from 'routing-controllers'
import { webhookValidation } from '@middlewares/validation.middleware'
import { UpdateIssueStatusDTO } from '@dtos/webhooks.dtos'
import { WebhookService } from '@services/webhook.service'

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
    createCodeReview() {
        return 'OK'
    }

    @Post('/code-review/close')
    deleteCodeReview() {
        return 'OK'
    }
}
