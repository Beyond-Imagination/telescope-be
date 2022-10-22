import { IsNotEmpty } from 'class-validator'

class WebhookPayload {
    className: string
    issue: {
        id: string
        assignee: {
            id: string
        }
    }
    status: {
        old: {
            resolved: boolean
        }
        new: {
            resolved: boolean
        }
    }
}

export class UpdateIssueStatusDTO {
    @IsNotEmpty()
    className: string

    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: WebhookPayload

    public isResolved(): boolean {
        return !this.payload.status.old.resolved && this.payload.status.new.resolved
    }

    public isUnresolved(): boolean {
        return this.payload.status.old.resolved && !this.payload.status.new.resolved
    }
}

export class CodeReviewDTO {
    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: {
        className: string
        isMergeRequest: boolean
        projectKey: {
            key: string
        }
        repository: string
        reviewId: string
        title: string
    }

    verificationToken: string

    @IsNotEmpty()
    webhookId: string
}
