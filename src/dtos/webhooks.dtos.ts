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

class UpdateIssueAssigneeWebhookPayload {
    className: string
    issue: {
        id: string
        status: {
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

export class UpdateIssueAssigneeDTO {
    @IsNotEmpty()
    className: string

    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: UpdateIssueAssigneeWebhookPayload

    public checkResolved(): boolean {
        return this.payload.issue.status.resolved
    }
}

class CreateIssueWebhookPayload {
    className: string
    meta: {
        principal: {
            details: {
                className: string
                user: {
                    id: string
                }
            }
        }
    }
    issue: {
        id: string
    }
    assignee: {
        new: {
            id: string
        }
    }
    status: {
        new: {
            resolved: boolean
        }
    }
}

class DeleteIssueWebhookPayload {
    className: string
    issue: {
        id: string
        assignee: {
            id: string
        }
        status: {
            resolved: boolean
        }
    }
    deleted: {
        new: boolean
    }
}

export class DeleteIssueDTO {
    @IsNotEmpty()
    className: string

    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: DeleteIssueWebhookPayload

    public checkResolved(): boolean {
        return this.payload.issue.status.resolved
    }
}

export class CreateIssueDTO {
    @IsNotEmpty()
    className: string

    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: CreateIssueWebhookPayload
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
