export class WebHookInfo {
    constructor(
        public webHookName: string,
        public url: string,
        public subscriptionName: string,
        public subjectCode: string,
        public eventTypeCode: string,
    ) {
        // nothing to do
    }
}
