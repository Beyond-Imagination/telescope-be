export namespace space {
    export interface webhookInfo {
        name: string
        url: string
        payloadFields?: string
        subscription: {
            name: string
            subjectCode: string
            eventTypeCode: string
        }
    }
    export interface installInfo {
        version: string
        webhooks: webhookInfo[]
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
