import { AchievementModel } from '@models/achievement'
import { Organization, OrganizationModel } from '@models/organization'
import { AchievementCount, ScoreDtos } from '@dtos/score.dtos'
import { CodeLinesRankingsDtos, MonthStarryPeopleDto, RankingsDtos } from '@dtos/rankings.dtos'
import { isNumber } from 'class-validator'
import { getBearerToken } from '@utils/verify.util'
import { SpaceClient } from '@/client/space.client'
import { CodeLineDiffModel } from '@models/CodeLineDiff'
import { CodeLinesDtos, CodeLinesSummary } from '@dtos/codeLines.dtos'

export class OrganizationService {
    spaceClient = SpaceClient.getInstance()

    // serverUrl에 해당하는 조직의 점수를 반환한다.
    public async getOrganizationScore(organization: Organization, from: Date, to: Date) {
        const achievementCounts: AchievementCount[] = await AchievementModel.getOrganizationScoreByClientId(organization.clientId, from, to)

        const result = new ScoreDtos(organization.points, achievementCounts[0])

        return { from: from, to: to, score: result }
    }

    public async getOrganizationScoreList(organization: Organization, from: Date, to: Date) {
        const achievementCounts: AchievementCount[] = await AchievementModel.getOrganizationScoreListByClientId(organization.clientId, from, to)
        const results = {}
        let index = 0

        function dateToFormatString(source): string {
            const month = source.getMonth() + 1
            const day = source.getDate()

            return [month, day].join('.')
        }

        for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            if (achievementCounts[index] && new Date(achievementCounts[index]._id.date) < nextDate) {
                results[dateToFormatString(date)] = new ScoreDtos(organization.points, achievementCounts[index])
                index++
            } else {
                results[dateToFormatString(date)] = new ScoreDtos(organization.points)
            }
        }

        return results
    }

    public async getRankingsInOrganization(organization: Organization, from: Date, to: Date, size: number | null) {
        const rankings: Array<RankingsDtos> = await this.getRankingsArray(
            AchievementModel.getRankingsByClientId(organization.clientId, from, to),
            organization,
            size,
            (item: AchievementCount) => new ScoreDtos(organization.points, item),
            (item, score, name, profilePicture) => new RankingsDtos(item._id, name, score, profilePicture),
            (r1, r2) => r2.score.total - r1.score.total,
        )

        return { size: rankings.length, from: from, to: to, rankings: rankings }
    }

    public async getStarryPeopleInOrganization(serverUrl: string, from: Date, to: Date) {
        const organization = await OrganizationModel.findByServerUrl(serverUrl)
        const [userList, profileMap] = await Promise.all([
            AchievementModel.getMostStarPeopleByClientId(organization.clientId, from, to),
            this.getProfileMap(serverUrl, organization),
        ])

        const people: Array<MonthStarryPeopleDto> = []
        userList.forEach(user => {
            const profile = profileMap.get(user.userId)
            if (!profile) {
                return
            }
            const name = `${profile.name.firstName} ${profile.name.lastName}`
            const profilePicture = profile.profilePicture
            people.push(new MonthStarryPeopleDto(user._id, user.userId, name, user.score, profilePicture))
        })
        return people
    }

    public async getCodeLinesRankingsInOrganization(organization: Organization, from: Date, to: Date, size: number | null) {
        const codeLines = await this.getRankingsArray(
            CodeLineDiffModel.getRankingsByClientId(organization.clientId, from, to),
            organization,
            size,
            (item: CodeLinesSummary) => new CodeLinesDtos(item),
            (item, codeLines, name, profilePicture) => new CodeLinesRankingsDtos(item._id, name, codeLines, profilePicture),
            (r1, r2) => r2.codeLines.total - r1.codeLines.total,
        )

        return { size: codeLines.length, from: from, to: to, codeLines: codeLines }
    }

    /**
     * @type D 가공하기전 원천데이터의 타입
     * @type T 1차 가공된 임시 데이터의 타입
     * @type R 최종 반환할 데이터의 타입이자 랭킹정보를 포함한 데이터 타입
     */
    private async getRankingsArray<D extends { _id: any }, T, R>(
        dataListPromise: Promise<Array<D>>,
        organization: Organization,
        size: number,
        dataToTemporalFactory: (d: D) => T,
        rankInfoFactory: (d: D, T: T, name: string, profilePicture: string) => R,
        compareFn: (r1: R, r2: R) => number,
    ) {
        const [list, profileMap] = await Promise.all([dataListPromise, this.getProfileMap(organization.serverUrl, organization)])
        const rankings: Array<R> = []

        list.forEach(dataItem => {
            const profile = profileMap.get(dataItem._id)
            if (!profile) {
                return
            }
            const name = `${profile.name.firstName} ${profile.name.lastName}`
            const profilePicture = profile.profilePicture
            const temporalValue = dataToTemporalFactory(dataItem)
            rankings.push(rankInfoFactory(dataItem, temporalValue, name, profilePicture))
        })

        rankings.sort(compareFn)

        if (isNumber(size) && size > rankings.length) {
            rankings.splice(size)
        } else {
            rankings.length
        }
        return rankings
    }

    private async getProfileMap(serverUrl: string, organization: Organization) {
        const token = await getBearerToken(serverUrl, organization.clientId, organization.clientSecret)
        const profilesArray = await this.spaceClient.requestProfiles(token, serverUrl)

        return profilesArray.data.data.reduce((map, obj) => {
            map.set(obj.id, obj)
            return map
        }, new Map())
    }
}
