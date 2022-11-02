import { AchievementModel } from '@models/achievement'
import { OrganizationModel, Point } from '@models/organization'
import { AchievementCount, ScoreDtos } from '@dtos/score.dtos'
import { RankingsDtos } from '@dtos/rankings.dtos'
import { isNumber } from 'class-validator'
import { getBearerToken } from '@utils/verifyUtil'
import { SpaceClient } from '@/client/space.client'

export class OrganizationService {
    spaceClient = new SpaceClient()

    // serverUrl에 해당하는 조직의 점수를 반환한다.
    public async getOrganizationScore(serverUrl: string, from: Date, to: Date) {
        const organization = await OrganizationModel.findByServerUrl(serverUrl)
        const achievementCounts: AchievementCount[] = await AchievementModel.getOrganizationScoreByClientId(organization.clientId, from, to)

        const result = new ScoreDtos(organization.points, achievementCounts[0])

        return { from: from, to: to, score: result }
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
            const score = new ScoreDtos(organization.points, achievement)
            rankings.push(new RankingsDtos(achievement._id, name, score))
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
