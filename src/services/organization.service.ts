import { AchievementModel } from '@models/achievement'
import { OrganizationModel } from '@models/organization'
import { ScoreDtos } from '@dtos/score.dtos'
import { RankingsDtos } from '@dtos/rankings.dtos'
import { isNumber } from 'class-validator'
import { getBearerToken } from '@utils/verifyUtil'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { SpaceClient } from '@/client/space.client'

export class OrganizationService {
    spaceClient = new SpaceClient()

    // serverUrl에 해당하는 조직의 점수를 반환한다.
    public async getOrganizationScore(serverUrl: string, from: Date, to: Date) {
        const clientId: string = ((await OrganizationModel.findByServerUrl(serverUrl)) ?? this.throwException()).clientId
        let score: any = await AchievementModel.getOrganizationScoreByClientId(clientId, from, to)

        score = score as ScoreDtos
        const scoreResult: ScoreDtos = score.length > 0 ? score[0] : new ScoreDtos()

        return { from: from, to: to, score: scoreResult }
    }

    public async getRankingsInOrganization(serverUrl: string, from: Date, to: Date, size: number | null) {
        const serverInfo = (await OrganizationModel.findByServerUrl(serverUrl)) ?? this.throwException()
        const scoreInfos = await AchievementModel.getRankingsByClientId(serverInfo.clientId, from, to)
        const token = await getBearerToken(serverUrl, serverInfo.clientId, serverInfo.clientSecret)

        const profiles = await this.spaceClient.requestProfiles(token, serverUrl)

        const profileSize = profiles.data.totalCount
        const rankInfos: Array<RankingsDtos> = []
        // O(N^2), 추후에 개선 필요한 로직입니다.
        for (let i = 0; i < scoreInfos.length; i++) {
            const target = scoreInfos[i]._id
            for (let j = 0; j < profileSize; j++) {
                if (profiles.data.data[j].id == target) {
                    const targetName = `${profiles.data.data[j].name.firstName} ${profiles.data.data[j].name.lastName}`
                    rankInfos.push(new RankingsDtos(target, targetName, scoreInfos[i]))
                    break
                }
            }
        }

        if (isNumber(size) && size > 0) {
            scoreInfos.splice(size)
        }

        size = scoreInfos.length
        return { size: size, from: from, to: to, rankings: rankInfos }
    }

    private throwException(): never {
        throw new OrganizationNotFoundException()
    }
}
