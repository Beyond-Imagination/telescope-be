import { space } from '@/types/space.type'

export class WebHookInfo {
    constructor(
        public webHookName: string,
        public url: string,
        public subscriptionName: string,
        public subjectCode: string,
        public eventTypeCode: string,
        public payloadFields: string = null,
    ) {
        // nothing to do
    }
}
export class WebhookAndSubscriptionsInfo {
    totalCount: number | undefined
    data: {
        webhook: {
            id: string
            name: string
            subscriptions: space.subscriptionsInfo[]
        }
    }[]
}
