import { space } from '@/types/space.type'
import v1_6_0 from '@/libs/space/version/v1.6.0'
import { SERVER_URL } from '@config'

const data: space.installInfo = {
    version: '1.7.0',
    webhooks: {
        ...v1_6_0.webhooks,
        update_issue_project: {
            name: 'update_issue_project',
            url: `${SERVER_URL}/webhooks/issue/update/project`,
            payloadFields: 'clientId,webhookId,payload(issue(id,assignee(id),projectId,status(resolved)))',
            subscription: {
                name: 'move_issue_project',
                subjectCode: 'Issue',
                eventTypeCode: 'Issue.Moved',
            },
        },
    },
    uiExtension: v1_6_0.uiExtension,
    right: v1_6_0.right,
}

export default data
