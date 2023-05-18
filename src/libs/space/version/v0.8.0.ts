import { space } from '@/types/space.type'
import { SERVER_URL } from '@config'
import v0_7_0 from '@/libs/space/version/v0.7.0'

const data: space.installInfo = {
    version: '0.8.0',
    webhooks: {
        ...v0_7_0.webhooks,
        add_chat_message_reaction: {
            name: 'add_chat_message_reaction',
            url: `${SERVER_URL}/webhooks/message/reaction/add`,
            payloadFields: 'payload(className,messageId,channelId,emoji,actor(details(user(id)))),clientId',
            subscription: {
                name: 'add_chat_message_reaction',
                subjectCode: 'Chat.Channel.Message.Reaction',
                eventTypeCode: 'Chat.Channel.Message.Reaction.Added',
                filters: [
                    {
                        className: 'ChatMessageReactionSubscriptionFilterIn',
                        emojis: ['star'],
                    },
                ],
            },
        },
        remove_chat_message_reaction: {
            name: 'remove_chat_message_reaction',
            url: `${SERVER_URL}/webhooks/message/reaction/remove`,
            payloadFields: 'payload(className,messageId,emoji,actor(details(user(id)))),clientId',
            subscription: {
                name: 'remove_chat_message_reaction',
                subjectCode: 'Chat.Channel.Message.Reaction',
                eventTypeCode: 'Chat.Channel.Message.Reaction.Removed',
                filters: [
                    {
                        className: 'ChatMessageReactionSubscriptionFilterIn',
                        emojis: ['star'],
                    },
                ],
            },
        },
    },
    uiExtension: v0_7_0.uiExtension,
    right: v0_7_0.right,
}

export default data
