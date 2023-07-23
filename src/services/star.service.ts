import { SpaceClient } from '@/client/space.client'
import { Achievement } from '@models/achievement'

export class StarService {
    private static instance: StarService
    private spaceClient = SpaceClient.getInstance()

    private constructor() {
        // private constructor
    }

    static getInstance() {
        if (!StarService.instance) {
            StarService.instance = new StarService()
        }
        return StarService.instance
    }

    async addPointToAuthor(serverUrl, clientId, giverId, messageId, author, axiosOption) {
        if (giverId) {
            if (author?.details?.user) {
                const receiverId = author.details.user.id
                await this.addPoint(serverUrl, clientId, giverId, receiverId, messageId, axiosOption)
            }
        }
    }

    async deletePoint(serverUrl, clientId, messageId, giverId, axiosOption) {
        if (giverId && (await Achievement.deleteStar(clientId, giverId, messageId)).deletedCount > 0) {
            await this.notifyRemainStar(serverUrl, clientId, giverId, axiosOption)
        }
    }

    async notifyRemainStar(serverUrl: string, clientId: string, userId: string, axiosOption: string) {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const remainStar = await Achievement.getRemainStarCountByUserId(clientId, startOfDay, new Date(), userId)

        await this.spaceClient.sendMessage(serverUrl, axiosOption, userId, `You can send ${remainStar} more star(s) today.`)
    }

    async getRemainStar(clientId: string, userId: string) {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const remainStar = await Achievement.getRemainStarCountByUserId(clientId, startOfDay, new Date(), userId)

        return { remainStar }
    }

    private async addPoint(serverUrl, clientId, giverId, receiverId, messageId, axiosOption) {
        if (giverId === receiverId) {
            await this.spaceClient.sendMessage(serverUrl, axiosOption, giverId, `You cannot send a star to yourself.`)
            return
        }

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const remainStar = await Achievement.getRemainStarCountByUserId(clientId, startOfDay, new Date(), giverId)
        if (remainStar > 0) {
            await Achievement.insertStar(clientId, receiverId, giverId, messageId)

            await this.spaceClient.sendMessage(
                serverUrl,
                axiosOption,
                receiverId,
                `You received ${await Achievement.getStarCountByUserId(clientId, new Date(0), new Date(), receiverId)} stars.`,
            )
            await this.notifyRemainStar(serverUrl, clientId, giverId, axiosOption)
        } else {
            await this.spaceClient.sendMessage(serverUrl, axiosOption, giverId, `You already sent all stars today.`)
        }
    }
}
