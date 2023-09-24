import { Controller, Get, QueryParams, Req, UseBefore } from 'routing-controllers'
import { OrganizationService } from '@services/organization.service'
import { getDaysBefore, getMonthsBefore } from '@utils/date'
import moment from 'moment-timezone'
import { setOrganizationByServerUrl } from '@middlewares/organization.middleware'
import { Request } from 'express'

class OrganizationScoreQuery {
    serverUrl: string

    from: Date | null

    to: Date | null

    size: number | null

    timezone = 'Etc/UTC'
}

class OrganizationScoreListQuery {
    serverUrl: string

    from: Date | null

    to: Date | null

    timezone = 'Etc/UTC'
}

@Controller('/api/organization')
export class OrganizationController {
    service: OrganizationService = new OrganizationService()

    /**
     *
     * @param query OrganizationScoreQuery
     */
    @Get('/score')
    @UseBefore(setOrganizationByServerUrl)
    score(@Req() req: Request, @QueryParams() query: OrganizationScoreQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()

        const fromDate = moment(from).tz(query.timezone).startOf('day').toDate()
        const toDate = moment(to).tz(query.timezone).endOf('day').toDate()

        return this.service.getOrganizationScore(req.organization, fromDate, toDate)
    }

    /**
     *
     * @param query OrganizationScoreListQuery
     */
    @Get('/score/list')
    @UseBefore(setOrganizationByServerUrl)
    scoreList(@Req() req: Request, @QueryParams() query: OrganizationScoreListQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(14)
        const to = query.to ? new Date(query.to) : new Date()

        const fromDate = moment(from).tz(query.timezone).startOf('day').toDate()
        const toDate = moment(to).tz(query.timezone).endOf('day').toDate()

        return this.service.getOrganizationScoreList(req.organization, fromDate, toDate)
    }

    /**
     *
     * @param query OrganizationScoreQuery
     */
    @Get('/rankings')
    rankings(@QueryParams() query: OrganizationScoreQuery) {
        const from = query.from ? new Date(query.from) : getDaysBefore(7)
        const to = query.to ? new Date(query.to) : new Date()

        const fromDate = moment(from).tz(query.timezone).startOf('day').toDate()
        const toDate = moment(to).tz(query.timezone).endOf('day').toDate()

        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getRankingsInOrganization(serverUrl, fromDate, toDate, query.size)
    }

    @Get('/star/rankings')
    starRankings(@QueryParams() query: OrganizationScoreListQuery) {
        const from = query.from ? new Date(query.from) : getMonthsBefore(10)
        const to = query.to ? new Date(query.to) : getMonthsBefore(1)

        const fromDate = moment(from).tz(query.timezone).startOf('month').toDate()
        const toDate = moment(to).tz(query.timezone).endOf('month').toDate()

        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getStarryPeopleInOrganization(serverUrl, fromDate, toDate)
    }
}
