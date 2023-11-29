import { Organization } from '@models/organization'
import { AchievementModel } from '@models/achievement'
import { ScoreDtos } from '@dtos/score.dtos'
import { CodeLineDiffModel } from '@models/CodeLineDiff'
import { CodeLinesDtos } from '@dtos/codeLines.dtos'

export class UserService {
    public async getUserScore(organization: Organization, from: Date, to: Date, userId: string) {
        const result = await AchievementModel.getUserScoreByClientId(organization.clientId, from, to, userId)

        const score = new ScoreDtos(organization.points, result[0]) // 각 항목의 가중치는 조직의 정책에 따른다
        return { from, to, userId, score }
    }

    public async getUserScoreList(organization: Organization, from: Date, to: Date, userId: string) {
        const achievementCounts = await AchievementModel.getUserScoreByClientIdGroupByDate(organization.clientId, from, to, userId)

        let index = 0
        const results = {}
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)
            const monthName = monthNames[date.getMonth()]
            if (!results[monthName]) {
                results[monthName] = []
            }

            if (achievementCounts[index] && new Date(achievementCounts[index]._id.date) < nextDate) {
                results[monthName].push(new ScoreDtos(organization.points, achievementCounts[index]).total)
                index++
            } else {
                results[monthName].push(0)
            }
        }
        return results
    }

    public async getUserCodeLines(organization: Organization, from: Date, to: Date, userId: string) {
        const result = await CodeLineDiffModel.getUserCodeLinesByClientId(organization.clientId, from, to, userId)

        const codeLines = new CodeLinesDtos(result[0]) // 각 항목의 가중치는 조직의 정책에 따른다
        return { from, to, userId, codeLines }
    }
}
