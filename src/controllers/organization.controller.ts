import { Controller, Get, QueryParams } from 'routing-controllers'
import { OrganizationService } from '@services/organization.service'
import { getDaysBefore } from '@utils/date'

class OrganizationScoreQuery {
    serverUrl: string

    from: Date | null

    to: Date | null

    size: number | null
}

class OrganizationScoreListQuery {
    serverUrl: string

    from: Date | null

    to: Date | null
}

@Controller('/api/organization')
export class OrganizationController {
    service: OrganizationService = new OrganizationService()

    /**
     *
     * @param query OrganizationScoreQuery
     */
    @Get('/score')
    score(@QueryParams() query: OrganizationScoreQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()
        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getOrganizationScore(serverUrl, from, to)
    }

    /**
     *
     * @param query OrganizationScoreListQuery
     */
    @Get('/score/list')
    scoreList(@QueryParams() query: OrganizationScoreListQuery) {
        const serverUrl = decodeURI(query.serverUrl)
        const from = query.from ? new Date(query.from) : getDaysBefore(14)
        const to = query.to ? new Date(query.to) : new Date()
        return this.service.getOrganizationScoreList(serverUrl, from, to)
    }

    /**
     *
     * @param query OrganizationScoreQuery
     */
    @Get('/rankings')
    rankings(@QueryParams() query: OrganizationScoreQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()
        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getRankingsInOrganization(serverUrl, from, to, query.size)
    }
}
