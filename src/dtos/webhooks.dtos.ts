import { IsNotEmpty } from 'class-validator'

class WebhookPayload {
    className: string
    meta: {
        principal: {
            details: {
                user: {
                    id: string
                }
            }
        }
    }
    issue: {
        id: string
        assignee: {
            id: string
        }
        status: {
            resolved: boolean
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
    assignee: {
        old: {
            id: string
        }
        new: {
            id: string
        }
    }
}

export class IssueDTO {
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

    public checkResolved(): boolean {
        return this.payload.issue.status.resolved
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
