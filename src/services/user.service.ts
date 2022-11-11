import { OrganizationModel } from '@models/organization'
import { AchievementModel } from '@models/achievement'
import { ScoreDtos } from '@dtos/score.dtos'

export class UserService {
    public async getUserScore(serverUrl: string, from: Date, to: Date, userId: string) {
        // 해당 서버에 속해있는 사용자에 대한 정보 조회
        const organization = await OrganizationModel.findByServerUrl(serverUrl)
        const result = await AchievementModel.getUserScoreByClientId(organization.clientId, from, to, userId)

        const score = new ScoreDtos(organization.points, result[0]) // 각 항목의 가중치는 조직의 정책에 따른다
        return { from, to, userId, score }
    }
}
