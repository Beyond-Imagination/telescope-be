import { Controller, Get, Param, QueryParams } from 'routing-controllers'
import { UserService } from '@services/user.service'
import { getDaysBefore } from '@utils/date'

class UserQuery {
    serverUrl: string
    from: Date | null
    to: Date | null
}

@Controller('/api/users')
export class UsersController {
    service: UserService = new UserService()

    @Get('/:userId/score')
    scoreByUserId(@Param('userId') id: string, @QueryParams() query: UserQuery) {
        // 기본 전략은 organization score API 와 동일
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()
        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getUserScore(serverUrl, from, to, id)
    }
}
