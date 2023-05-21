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
            if (author.details.user) {
                const receiverId = author.details.user.id
                const receiverName = author.name
                await this.addPoint(serverUrl, clientId, giverId, receiverId, receiverName, messageId, axiosOption)
            }
        }
    }

    async deletePoint(serverUrl, clientId, messageId, giverId, axiosOption) {
        if (giverId) {
            await Achievement.deleteStar(clientId, giverId, messageId)

            await this.notifyRemainStar(serverUrl, clientId, giverId, axiosOption)
        }
    }

    async notifyRemainStar(serverUrl: string, clientId: string, userId: string, axiosOption: string) {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const remainStar = await Achievement.getRemainStarCountByUserId(clientId, startOfDay, new Date(), userId)

        if (remainStar > 0) {
            await this.spaceClient.sendMessage(serverUrl, axiosOption, userId, `오늘 ${remainStar}번 더 Star를 보낼 수 있습니다.`)
        } else {
            await this.spaceClient.sendMessage(serverUrl, axiosOption, userId, `오늘은 더이상 Star를 보낼 수 없습니다.`)
        }
    }

    private async addPoint(serverUrl, clientId, giverId, receiverId, receiverName, messageId, axiosOption) {
        if (giverId === receiverId) {
            await this.spaceClient.sendMessage(serverUrl, axiosOption, giverId, `스스로에게 별을 보낼 수 없습니다.`)
            return
        }

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const now = new Date()
        const remainStar = await Achievement.getRemainStarCountByUserId(clientId, startOfDay, now, giverId)
        if (remainStar > 0) {
            await Achievement.insertStar(clientId, receiverId, giverId, messageId)

            await this.spaceClient.sendMessage(
                serverUrl,
                axiosOption,
                receiverId,
                `${receiverName}님 현재 ${await Achievement.getStarCountByUserId(clientId, new Date(0), now, receiverId)}번 칭찬 받았습니다`,
            )
        }
        await this.notifyRemainStar(serverUrl, clientId, giverId, axiosOption)
    }
}
