import { Controller, Get, HeaderParam, Param, QueryParams } from 'routing-controllers'
import { UserService } from '@services/user.service'
import { getDaysBefore } from '@utils/date'
import { SpaceClient } from '@/client/space.client'

class UserQuery {
    serverUrl: string
    from: Date | null
    to: Date | null
}

class PictureQuery {
    serverUrl: string
    profilePicture: string
}

@Controller('/api/users')
export class UsersController {
    service: UserService = new UserService()
    spaceClient = new SpaceClient()

    @Get('/picture')
    async picture(@HeaderParam('Authorization') token: string, @QueryParams() query: PictureQuery) {
        const response = await this.spaceClient.requestProfileImage(token, query.serverUrl, query.profilePicture)
        return response.data
    }

    @Get('/:userId/score')
    scoreByUserId(@Param('userId') id: string, @QueryParams() query: UserQuery) {
        // 기본 전략은 organization score API 와 동일
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()
        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getUserScore(serverUrl, from, to, id)
    }
}
