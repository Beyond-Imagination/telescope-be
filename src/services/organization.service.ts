import { AchievementModel } from '@models/achievement'
import { OrganizationModel } from '@models/organization'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { dateToString } from '@utils/DateUtils'
import { ScoreDtos } from '@dtos/score.dtos'
import { RankingsDtos } from '@dtos/rankings.dtos'
import { isNumber } from 'class-validator'
import axios from 'axios'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { getBearerToken } from '@utils/verifyUtil'

export class OrganizationService {
    // serverUrl에 해당하는 조직의 점수를 반환한다.
    public async getOrganizationScore(serverUrl: string, from: Date, to: Date) {
        const serverId: string = (await this.getServerInfoByUrl(serverUrl))[0]
        let score: any = await AchievementModel.getOrganizationScoreByClientId(serverId, from, to)

        score = score as ScoreDtos
        const scoreResult: ScoreDtos = score.length > 0 ? score[0] : new ScoreDtos()

        return { from: dateToString(from), to: dateToString(to), score: scoreResult }
    }

    public async getRankingsInOrganization(serverUrl: string, from: Date, to: Date, size: number | null) {
        const serverInfo = await this.getServerInfoByUrl(serverUrl)
        const scoreInfos = await AchievementModel.getRankingsByClientId(serverInfo[0], from, to)
        const token = await getBearerToken(serverUrl, serverInfo[0], serverInfo[1])

        const profiles = await this.requestProfiles(token, serverUrl)

        const profileSize = profiles.data.totalCount
        const rankInfos: Array<RankingsDtos> = []
        // O(N^2), 추후에 개선 필요한 로직입니다.
        for (let i = 0; i < scoreInfos.length; i++) {
            const target = scoreInfos[i]._id
            for (let j = 0; j < profileSize; j++) {
                if (profiles.data.data[j].id == target) {
                    const targetName = profiles.data.data[j].name.firstName + profiles.data.data[j].name.lastName
                    rankInfos.push(new RankingsDtos(target, targetName, from, to, scoreInfos[i]))
                    break
                }
            }
        }

        if (isNumber(size) && size > 0) {
            scoreInfos.splice(size)
        }

        size = scoreInfos.length
        return { size: size, from: dateToString(from), to: dateToString(to), rankings: rankInfos }
    }

    private async getServerInfoByUrl(serverUrl: string): Promise<string[]> {
        const info = await OrganizationModel.findOne({ serverUrl: serverUrl }).exec()
        if (info == null) {
            throw new OrganizationNotFoundException()
        }
        return [info.clientId, info.clientSecret]
    }

    private async requestProfiles(token: string, serverUrl: string) {
        const requestUrl = `${serverUrl}/api/http/team-directory/profiles`
        return axios
            .get(requestUrl, {
                headers: {
                    Authorization: `${token}`,
                    Accept: `application/json`,
                },
                params: {
                    $fields: 'data(id,name),totalCount',
                },
            })
            .catch(function (error) {
                console.log(error)
                throw new InvalidRequestException()
            })
    }
}
