import { Controller, Get, HeaderParam, Param, QueryParams, Req, UseBefore } from 'routing-controllers'
import { UserService } from '@services/user.service'
import { getDaysBefore } from '@utils/date'
import { SpaceClient } from '@/client/space.client'
import { StarService } from '@services/star.service'
import { setOrganizationByServerUrl } from '@middlewares/organization.middleware'
import { Request } from 'express'
import moment from 'moment-timezone'

class UserQuery {
    serverUrl: string
    from: Date | null
    to: Date | null
    timezone = 'Etc/UTC'
}

class PictureQuery {
    serverUrl: string
    profilePicture: string
}

class StarQuery {
    serverUrl: string
    userId: string
    timezone = 'Etc/UTC'
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
    @UseBefore(setOrganizationByServerUrl)
    scoreByUserId(@Req() req: Request, @Param('userId') id: string, @QueryParams() query: UserQuery) {
        // 기본 전략은 organization score API 와 동일
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()

        const fromDate = moment(from).tz(query.timezone).startOf('day').toDate()
        const toDate = moment(to).tz(query.timezone).endOf('day').toDate()

        return this.service.getUserScore(req.organization, fromDate, toDate, id)
    }

    @Get('/:userId/score/list')
    @UseBefore(setOrganizationByServerUrl)
    scoreListByUserId(@Req() req: Request, @Param('userId') id: string, @QueryParams() query: UserQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(174) // 7 * 25 - 1
        from.setDate(from.getDate() + ((7 - from.getDay()) % 7)) // 시작을 항상 일요일로 맞추기 위해 계산해준다
        const to = query.to ? new Date(query.to) : new Date()

        const fromDate = moment(from).tz(query.timezone).startOf('day').toDate()
        const toDate = moment(to).tz(query.timezone).endOf('day').toDate()

        return this.service.getUserScoreList(req.organization, fromDate, toDate, id)
    }

    @Get('/remainStar')
    @UseBefore(setOrganizationByServerUrl)
    async remainStar(@Req() req: Request, @QueryParams() query: StarQuery) {
        const startOfDay = moment().tz(query.timezone).startOf('day').toDate()
        const endOfDay = moment().tz(query.timezone).endOf('day').toDate()

        return this.starService.getRemainStar(req.organization.clientId, query.userId, startOfDay, endOfDay)
    }
}
