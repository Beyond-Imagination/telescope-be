import { AchievementModel } from '@models/achievement'
import { Organization, OrganizationModel } from '@models/organization'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { dateToString } from '@utils/DateUtils'
import { ScoreDtos } from '@dtos/score.dtos'

export class OrganizationService {
    // serverUrl에 해당하는 조직의 점수를 반환한다.
    public async getOrganizationScore(serverUrl: string, from: Date, to: Date) {
        const organization: Organization = await OrganizationModel.findByServerUrl(serverUrl)
        if (!organization) {
            throw new OrganizationNotFoundException()
        }
        const serverId: string = organization.clientId
        let score: any = await AchievementModel.getOrganizationScoreByClientId(serverId, from, to)

        score = score as ScoreDtos
        const scoreResult: ScoreDtos = score.length > 0 ? score[0] : new ScoreDtos()

        return { from: dateToString(from), to: dateToString(to), score: scoreResult }
    }
}
