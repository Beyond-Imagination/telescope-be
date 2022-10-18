import {AchievementModel} from '@models/achievement'
import {Organization, OrganizationModel} from '@models/organization'
import {OrganizationNotFoundException} from '@exceptions/OrganizationNotFoundException'
import {dateToString} from '@utils/DateUtils'
import {ScoreDtos} from '@dtos/score.dtos'

export class TeamService {
    // serverUrl에 해당하는 조직의 team 점수를 반환한다.
    public async getTeamScore(serverUrl: string, from: Date, to: Date) {
        const organization: Organization = await OrganizationModel.findOne({serverUrl: serverUrl}).exec()
        if (organization == null) {
            throw new OrganizationNotFoundException()
        }
        const serverId: string = organization.clientId
        let score: any = await AchievementModel.getTeamScoreByClientId(serverId, from, to)

        score = score as ScoreDtos
        const scoreResult: ScoreDtos = score.length > 0 ? score[0] : new ScoreDtos()

        return {from: dateToString(from), to: dateToString(to), score: scoreResult}
    }
}
