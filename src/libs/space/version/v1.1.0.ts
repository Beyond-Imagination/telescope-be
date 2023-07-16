import { space } from '@/types/space.type'
import v0_8_0 from '@/libs/space/version/v0.8.0'
import { SERVER_URL } from '@config'

const data: space.installInfo = {
    version: '1.1.0',
    webhooks: {
        create_issue: v0_8_0.webhooks.create_issue,
        update_issue_status: v0_8_0.webhooks.update_issue_status,
        update_issue_assignee: v0_8_0.webhooks.update_issue_assignee,
        delete_issue: v0_8_0.webhooks.delete_issue,
        create_code_review: v0_8_0.webhooks.create_code_review,
        close_code_review: v0_8_0.webhooks.close_code_review,
        add_chat_message_reaction: v0_8_0.webhooks.add_chat_message_reaction,
        remove_chat_message_reaction: v0_8_0.webhooks.remove_chat_message_reaction,
        create_code_review_discussion: {
            name: 'create_code_review_discussion',
            url: `${SERVER_URL}/webhooks/code-review/discussion/create`,
            payloadFields: 'payload(className,discussion(discussion(id)),meta(principal(details(user(id)))),review(id)),clientId',
            subscription: {
                name: 'create_code_review_discussion',
                subjectCode: 'CodeReview',
                eventTypeCode: 'CodeReview.Discussion.Created',
            },
        },
        remove_code_review_discussion: {
            name: 'remove_code_review_discussion',
            url: `${SERVER_URL}/webhooks/code-review/discussion/remove`,
            payloadFields: 'payload(className,discussion(discussion(id)),meta(principal(details(user(id)))),review(id)),clientId',
            subscription: {
                name: 'remove_code_review_discussion',
                subjectCode: 'CodeReview',
                eventTypeCode: 'CodeReview.Discussion.Removed',
            },
        },
    },
    uiExtension: {
        contextIdentifier: v0_8_0.uiExtension.contextIdentifier,
        extension: v0_8_0.uiExtension.extension,
    },
    right: v0_8_0.right,
}

export default data
