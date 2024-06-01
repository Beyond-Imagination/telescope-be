import { Controller, Get, QueryParams, Req, UseBefore } from 'routing-controllers'
import { OrganizationService } from '@services/organization.service'
import { getStartOfMonthsBefore } from '@utils/date'
import moment from 'moment-timezone'
import { setOrganizationByServerUrl } from '@middlewares/organization.middleware'
import { Request } from 'express'
import { setFromToDate } from '@middlewares/date.middleware'

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
     * @param req Request
     * @param query OrganizationScoreQuery
     */
    @Get('/score')
    @UseBefore(setOrganizationByServerUrl)
    @UseBefore(setFromToDate(7))
    score(@Req() req: Request) {
        return this.service.getOrganizationScore(req.organization, req.fromDate, req.toDate)
    }

    /**
     * @param req Request
     * @param query OrganizationScoreListQuery
     */
    @Get('/score/list')
    @UseBefore(setOrganizationByServerUrl)
    @UseBefore(setFromToDate(14))
    scoreList(@Req() req: Request) {
        return this.service.getOrganizationScoreList(req.organization, req.fromDate, req.toDate)
    }

    /**
     * @param req Request
     * @param query OrganizationScoreQuery
     */
    @Get('/rankings')
    @UseBefore(setOrganizationByServerUrl)
    @UseBefore(setFromToDate(7))
    rankings(@Req() req: Request, @QueryParams() query: OrganizationScoreQuery) {
        return this.service.getRankingsInOrganization(req.organization, req.fromDate, req.toDate, query.size)
    }

    /**
     * @param query OrganizationScoreQuery
     */
    @Get('/star/rankings')
    starRankings(@QueryParams() query: OrganizationScoreListQuery) {
        const from = query.from ? new Date(query.from) : getStartOfMonthsBefore(10)
        const to = query.to ? new Date(query.to) : getStartOfMonthsBefore(1)

        const fromDate = moment(from).tz(query.timezone).startOf('month').toDate()
        const toDate = moment(to).tz(query.timezone).endOf('month').toDate()

        const serverUrl = decodeURI(query.serverUrl)
        return this.service.getStarryPeopleInOrganization(serverUrl, fromDate, toDate)
    }

    /**
     * @param req Request
     * @param query OrganizationScoreQuery
     */
    @Get('/code-lines/rankings')
    @UseBefore(setOrganizationByServerUrl)
    @UseBefore(setFromToDate(7))
    codeLinesRankings(@Req() req: Request, @QueryParams() query: OrganizationScoreQuery) {
        return this.service.getCodeLinesRankingsInOrganization(req.organization, req.fromDate, req.toDate, query.size)
    }
}
