import {Controller, Get, QueryParam} from 'routing-controllers'
import {TeamService} from '@services/team.service'
import {ONE_DAY_MSEC, stringToDate} from '@utils/DateUtils'

@Controller('/api/team')
export class TeamController {
    service: TeamService = new TeamService()

    /**
     *
     * @param serverUrl 서버에 해당하는 url, FE에서 전달.
     * @param from 기본값(7일 전), 'yyyy-mm-dd' 형식의 String
     * @param to 기본값(오늘), 'yyyy-mm-dd' 형식의 String
     */
    @Get('/score')
    score(@QueryParam('serverUrl') serverUrl: string,
          @QueryParam('from') from: string | null,
          @QueryParam('to') to: string | null) {

        const dFrom: Date = from ? stringToDate(from) : new Date(Date.now() - 7 * ONE_DAY_MSEC)
        const dTo: Date = to ? stringToDate(to) : new Date(Date.now())

        return this.service.getTeamScore(serverUrl, dFrom, dTo)
    }

    @Get('/rankings')
    rankings() {
        return {rankings: []}
    }
}
