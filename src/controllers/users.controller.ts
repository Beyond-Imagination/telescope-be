import { Controller, Get, HeaderParam, Param, QueryParams, Req, UseBefore } from 'routing-controllers'
import { UserService } from '@services/user.service'
import { getDaysBefore } from '@utils/date'
import { SpaceClient } from '@/client/space.client'
import { StarService } from '@services/star.service'
import { OrganizationModel } from '@/models/organization'
import { setOrganizationByServerUrl } from '@middlewares/organization.middleware'
import { Request } from 'express'

class UserQuery {
    serverUrl: string
    from: Date | null
    to: Date | null
}

class PictureQuery {
    serverUrl: string
    profilePicture: string
}

class StarQuery {
    serverUrl: string
    userId: string
}

@Controller('/api/users')
export class UsersController {
    service: UserService = new UserService()
    starService: StarService = StarService.getInstance()
    spaceClient = SpaceClient.getInstance()

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

    @Get('/:userId/score/list')
    @UseBefore(setOrganizationByServerUrl)
    scoreListByUserId(@Req() req: Request, @Param('userId') id: string, @QueryParams() query: UserQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(174) // 7 * 25 - 1
        from.setDate(from.getDate() + ((7 - from.getDay()) % 7)) // 시작을 항상 일요일로 맞추기 위해 계산해준다
        const to = query.to ? new Date(query.to) : new Date()
        return this.service.getUserScoreList(req.organization, from, to, id)
    }

    @Get('/remainStar')
    async remainStar(@QueryParams() query: StarQuery) {
        const organization = await OrganizationModel.findByServerUrl(query.serverUrl)
        return this.starService.getRemainStar(organization.clientId, query.userId)
    }
}
