import { Controller, Post } from 'routing-controllers'

@Controller('/webhooks')
export class WebhooksController {
    @Post('/issue/create')
    createIssue() {
        return 'OK'
    }

    @Post('/issue/update/status')
    updateIssueStatus() {
        return 'OK'
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
