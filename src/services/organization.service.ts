import { AchievementModel } from '@models/achievement'
import { Organization, OrganizationModel } from '@models/organization'
import { AchievementCount, ScoreDtos } from '@dtos/score.dtos'
import { RankingsDtos } from '@dtos/rankings.dtos'
import { isNumber } from 'class-validator'
import { getBearerToken } from '@utils/verify.util'
import { SpaceClient } from '@/client/space.client'

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

    public async getRankingsInOrganization(serverUrl: string, from: Date, to: Date, size: number | null) {
        const organization = await OrganizationModel.findByServerUrl(serverUrl)
        const token = await getBearerToken(serverUrl, organization.clientId, organization.clientSecret)

        const [userAchievements, profilesArray] = await Promise.all([
            AchievementModel.getRankingsByClientId(organization.clientId, from, to),
            this.spaceClient.requestProfiles(token, serverUrl),
        ])

        const profileMap = profilesArray.data.data.reduce((map, obj) => {
            map.set(obj.id, obj)
            return map
        }, new Map())

        const rankings: Array<RankingsDtos> = []
        userAchievements.forEach(achievement => {
            const profile = profileMap.get(achievement._id)
            if (!profile) {
                return
            }
            const name = `${profile.name.firstName} ${profile.name.lastName}`
            const profilePicture = profile.profilePicture
            const score = new ScoreDtos(organization.points, achievement)
            rankings.push(new RankingsDtos(achievement._id, name, score, profilePicture))
        })

        rankings.sort((a, b) => b.score.total - a.score.total)

        if (isNumber(size) && size > rankings.length) {
            rankings.splice(size)
        } else {
            size = rankings.length
        }

        return { size: size, from: from, to: to, rankings: rankings }
    }
}
