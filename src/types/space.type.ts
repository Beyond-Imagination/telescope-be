export namespace space {
    export interface webhookInfo {
        name: string
        url: string
        payloadFields?: string
        subscription: {
            name: string
            subjectCode: string
            eventTypeCode: string
            filters?: [object]
        }
    }

    export interface installInfo {
        version: string
        webhooks: {
            create_issue: webhookInfo
            update_issue_status: webhookInfo
            update_issue_assignee: webhookInfo
            delete_issue: webhookInfo
            create_code_review: webhookInfo
            close_code_review: webhookInfo
            add_chat_message_reaction: webhookInfo
            remove_chat_message_reaction: webhookInfo
        }
        uiExtension: {
            contextIdentifier: string
            extension: {
                className: string
                displayName?: string
                uniqueCode?: string
                iframeUrl: string
            }[]
        }
        right: {
            codes: string[]
        }
    }

    export interface subscriptionsInfo {
        id: string
        name: string
        subscription: {
            eventTypeCodes: string[]
            subjectCode: string
            filters: string[]
        }
    }
}

export namespace payload {
    export enum className {
        INSTALL = 'InitPayload',
        UNINSTALL = 'ApplicationUninstalledPayload',
        CHANGE_URL = 'ChangeServerUrlPayload',
        ISSUE_WEBHOOK = 'IssueWebhookEvent',
        APP_PUBLICATION_CHECK = 'AppPublicationCheckPayload',
        WEBHOOK_REQUEST = 'WebhookRequestPayload',
    }

    export const typeFactory = {
        of: (typeParam: string): className | undefined => {
            return Object.values(className).find(elem => elem === typeParam)
        },
    }
}
