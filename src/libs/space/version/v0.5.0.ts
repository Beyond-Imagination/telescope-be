import { space } from '@/types/space.type'
import { CLIENT_URL, SERVER_URL } from '@config'

const data: space.installInfo = {
    version: '0.5.0',
    webhooks: [
        {
            name: 'create_issue',
            url: `${SERVER_URL}/webhooks/issue/create`,
            payloadFields:
                'clientId,webhookId,verificationToken,payload(assignee(new(id)),meta(principal(details(user(id)))),status(new(resolved)),issue(id))',
            subscription: {
                name: 'create_issue',
                subjectCode: 'Issue',
                eventTypeCode: 'Issue.Created',
            },
        },
        {
            name: 'update_issue_status',
            url: `${SERVER_URL}/webhooks/issue/update/status`,
            payloadFields: 'clientId,verificationToken,webhookId,payload(issue(id,assignee(id)),status(new(resolved),old(resolved)))',
            subscription: {
                name: 'update_issue_status',
                subjectCode: 'Issue',
                eventTypeCode: 'Issue.StatusUpdated',
            },
        },
        {
            name: 'update_issue_assignee',
            url: `${SERVER_URL}/webhooks/issue/update/assignee`,
            payloadFields: 'clientId,verificationToken,webhookId,payload(assignee(old(id),new(id)),issue(id,status(resolved)))',
            subscription: {
                name: 'update_issue_assignee',
                subjectCode: 'Issue',
                eventTypeCode: 'Issue.AssigneeUpdated',
            },
        },
        {
            name: 'delete_issue',
            url: `${SERVER_URL}/webhooks/issue/delete`,
            payloadFields: 'clientId,verificationToken,webhookId,payload(issue(id,assignee(id),status(resolved)),deleted(new))',
            subscription: {
                name: 'delete_issue',
                subjectCode: 'Issue',
                eventTypeCode: 'Issue.Deleted',
            },
        },
        {
            name: 'create_code_review',
            url: `${SERVER_URL}/webhooks/code-review/create`,
            subscription: {
                name: 'create_code_review',
                subjectCode: 'CodeReview',
                eventTypeCode: 'CodeReview.Created',
            },
        },
        {
            name: 'close_code_review',
            url: `${SERVER_URL}/webhooks/code-review/close`,
            subscription: {
                name: 'close_code_review',
                subjectCode: 'CodeReview',
                eventTypeCode: 'CodeReview.Closed',
            },
        },
    ],
    uiExtension: {
        contextIdentifier: 'global',
        extension: [
            {
                className: 'ApplicationHomepageUiExtensionIn',
                iframeUrl: CLIENT_URL,
            },
        ],
    },
    right: {
        codes: ['Project.CodeReview.View', 'Profile.View', 'Project.Issues.View'],
    },
}

export default data
