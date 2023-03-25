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
        projectId: string
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

// todo: should not use deprecated fields
export class CodeReviewDTO {
    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: {
        className: string
        isMergeRequest: boolean // deprecated
        projectKey: {
            key: string // deprecated
        }
        review: {
            id: string
            project: {
                key: string
            }
            projectId: string
            branchPairs: {
                isMerged: string
            }[]
            createdBy: {
                id: string
            }
        }
        repository: string
        reviewId: string // deprecated
        title: string // deprecated
    }

    verificationToken: string // deprecated

    @IsNotEmpty()
    webhookId: string
}

export class UpdateWebhookDTO {
    // https://bit.ly/4006B0b
    @IsNotEmpty()
    applicationId: string

    @IsNotEmpty()
    webhookId: string

    @IsNotEmpty()
    name: string

    description: string | undefined

    enabled = true

    endpoint: {
        url: string | undefined
        sslVerification: boolean
    }
}

export class UpdateSubscriptionDTO {
    @IsNotEmpty()
    applicationId: string

    @IsNotEmpty()
    webhookId: string

    @IsNotEmpty()
    subscriptionId: string

    name: string
    enabled: boolean
    subjectCode: string
    eventTypeCodes: string[]
}
