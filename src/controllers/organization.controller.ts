import { Controller, Get, QueryParam } from 'routing-controllers'
import { OrganizationService } from '@services/organization.service'
import { ONE_DAY_MSEC, stringToDate } from '@utils/DateUtils'

@Controller('/api/organization')
export class OrganizationController {
    service: OrganizationService = new OrganizationService()

    /**
     *
     * @param serverUrl 서버에 해당하는 url, FE에서 전달.
     * @param from 기본값(7일 전), 'yyyy-mm-dd' 형식의 String
     * @param to 기본값(오늘), 'yyyy-mm-dd' 형식의 String
     */
    @Get('/score')
    score(@QueryParam('serverUrl') serverUrl: string, @QueryParam('from') from: string | null, @QueryParam('to') to: string | null) {
        const dFrom: Date = from ? stringToDate(from) : new Date(Date.now() - 7 * ONE_DAY_MSEC)
        const dTo: Date = to ? stringToDate(to) : new Date(Date.now())

        return this.service.getOrganizationScore(serverUrl, dFrom, dTo)
    }

    /**
     *
     * @param serverUrl 서버에 해당하는 url, FE에서 전달.
     * @param size 기본값(전체), 상위 size명의 Rankings
     * @param from 기본값(7일 전), 'yyyy-mm-dd' 형식의 String
     * @param to 기본값(오늘), 'yyyy-mm-dd' 형식의 String
     */
    @Get('/rankings')
    rankings(
        @QueryParam('serverUrl') serverUrl: string,
        @QueryParam('size') size: number | null,
        @QueryParam('from') from: string | null,
        @QueryParam('to') to: string | null,
    ) {
        const dFrom: Date = from ? stringToDate(from) : new Date(Date.now() - 7 * ONE_DAY_MSEC)
        const dTo: Date = to ? stringToDate(to) : new Date(Date.now())

        return this.service.getRankingsInOrganization(serverUrl, dFrom, dTo, size)
    }
}
