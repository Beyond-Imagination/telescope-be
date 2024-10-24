import { IsNotEmpty } from 'class-validator'
import { space } from '@/types/space.type'

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

export class CodeReviewDTO {
    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: {
        className: string
        review: {
            className: string
            id: string
            project: {
                key: string
            }
            projectId: string
            branchPairs: {
                isMerged: boolean
            }[]
            createdBy: {
                id: string
            }
        }
        repository: string
    }
}

export class CodeReviewDiscussionDTO {
    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: {
        className: string
        discussion: {
            discussion: {
                id: string
            }
        }
        meta: {
            principal: {
                details: {
                    user: {
                        id: string
                    }
                }
            }
        }
        review: {
            id: string
        }
    }
}

export class ReviewerReviewDTO {
    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    payload: {
        className: string
        isMergeRequest: boolean
        review: {
            id: string
        }
        meta: {
            principal: {
                details: {
                    user: {
                        id: string
                    }
                }
            }
        }
        reviewerState: {
            old: string
            new: string
        }
    }
}

export class UpdateWebhookDTO {
    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    webhookId: string

    @IsNotEmpty()
    name: string

    payloadFields: string

    description: string | undefined

    enabled = true

    endpoint: {
        url: string | undefined
        sslVerification: boolean
    }

    constructor(
        clientId: string,
        webhookId: string,
        name: string,
        payloadFields: string,
        description: string | undefined,
        enabled: boolean,
        endpoint: { url: string | undefined; sslVerification: boolean },
    ) {
        this.clientId = clientId
        this.webhookId = webhookId
        this.name = name
        this.payloadFields = payloadFields
        this.description = description
        this.enabled = enabled
        this.endpoint = endpoint
    }

    static of(clientId: string, webhookId: string, info: space.webhookInfo): UpdateWebhookDTO {
        return new UpdateWebhookDTO(clientId, webhookId, info.name, info.payloadFields, undefined, true, {
            url: info.url,
            sslVerification: false,
        })
    }
}

export class UpdateSubscriptionDTO {
    @IsNotEmpty()
    webhookId: string

    @IsNotEmpty()
    subscriptionId: string

    name: string
    enabled: boolean
    subjectCode: string
    eventTypeCodes: string[]
    filters: string[]

    constructor(
        webhookId: string,
        subscriptionId: string,
        name: string,
        enabled: boolean,
        subjectCode: string,
        eventTypeCodes: string[],
        filters: string[],
    ) {
        this.webhookId = webhookId
        this.subscriptionId = subscriptionId
        this.name = name
        this.enabled = enabled
        this.subjectCode = subjectCode
        this.eventTypeCodes = eventTypeCodes
        this.filters = filters
    }
}

export class ReactionDTO {
    @IsNotEmpty()
    className: string

    @IsNotEmpty()
    clientId: string

    payload: {
        className: string
        emoji: string
        messageId: string
        channelId: string
        actor: {
            details: {
                user: { id: string }
            }
        }
    }
}
