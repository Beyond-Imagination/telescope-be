import { Controller, Get, QueryParams } from 'routing-controllers'
import { OrganizationService } from '@services/organization.service'
import { getDaysBefore } from '@utils/date'

class OrganizationQuery {
    serverUrl: string

    from: Date | null

    to: Date | null

    size: number | null
}

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
    score(@QueryParams() query: OrganizationQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()

        return this.service.getOrganizationScore(query.serverUrl, from, to)
    }

    /**
     *
     * @param serverUrl 서버에 해당하는 url, FE에서 전달.
     * @param size 기본값(전체), 상위 size명의 Rankings
     * @param from 기본값(7일 전), 'yyyy-mm-dd' 형식의 String
     * @param to 기본값(오늘), 'yyyy-mm-dd' 형식의 String
     */
    @Get('/rankings')
    rankings(@QueryParams() query: OrganizationQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()

        return this.service.getRankingsInOrganization(query.serverUrl, from, to, query.size)
    }
}
