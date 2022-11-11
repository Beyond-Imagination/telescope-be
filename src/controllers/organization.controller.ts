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
     * @param query OrganizationQuery
     */
    @Get('/score')
    score(@QueryParams() query: OrganizationQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()
        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getOrganizationScore(serverUrl, from, to)
    }

    /**
     *
     * @param query OrganizationQuery
     */
    @Get('/rankings')
    rankings(@QueryParams() query: OrganizationQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()
        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getRankingsInOrganization(serverUrl, from, to, query.size)
    }
}
