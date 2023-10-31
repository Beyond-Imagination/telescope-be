import { admin } from '@/types/admin.type'

export const data: { [key: string]: admin.messageInfo } = {
    '0': {
        id: '0',
        title: 'Star0',
        content: 'Star0 is available on Space. ~~~',
    },
    '1': {
        id: '1',
        title: 'Star1',
        content: 'Star1 is available on Space. ~~~',
    },
}

export function getMessageById(id: string) {
    const messageArray = Object.values(data)
    return messageArray.find(message => message.id === id)
}
