import { UserService } from '@services/user.service'
import {
    setTestDB,
    testClientId,
    testClientSecret,
    testIssueId,
    testOrganizationAdminId,
    testSpaceURL,
    testUserId,
    testWebhooks,
} from '@/test/test.util'
import { OrganizationModel } from '@models/organization'
import { AchievementModel, AchievementType } from '@models/achievement'
import moment from 'moment-timezone'

describe('UserService 클래스', () => {
    const sut = new UserService()

    setTestDB()

    describe('getUserScoreList 메소드에서', () => {
        it('정상적인 요청이면 날짜별 Achievement 수를 반환한다', async () => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const organization = await OrganizationModel.saveOrganization(
                testClientId,
                testClientSecret,
                testSpaceURL,
                testOrganizationAdminId,
                testWebhooks,
                null,
            )
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testUserId,
                issueId: testIssueId,
                type: AchievementType.CreateCodeReview,
            })
            const from = new Date()
            from.setTime(from.getTime() - 1000 * 60 * 60 * 24 * 30)
            const fromDate = moment(from).startOf('day').toDate()
            const to = new Date()
            const toDate = moment(to).endOf('day').toDate()

            const result = await sut.getUserScoreList(organization, fromDate, toDate, testUserId)
            expect(result[monthNames[to.getMonth()]].length).toBe(to.getDate())
            expect(result[monthNames[to.getMonth()]][to.getDate() - 1]).toBe(1)
        })
    })
})
