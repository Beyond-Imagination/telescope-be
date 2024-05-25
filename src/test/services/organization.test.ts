import { OrganizationService } from '@services/organization.service'
import {
    mockingAxios,
    setTestDB,
    testAdminName,
    testClientId,
    testClientSecret,
    testIssueId,
    testOrganizationAdminId,
    testProfilePicture,
    testProjectId,
    testReviewId,
    testSpaceURL,
    testUserId,
    testUserName,
    testWebhooks,
} from '@/test/test.util'
import { AchievementCount, ScoreDtos } from '@dtos/score.dtos'
import { Organization, OrganizationModel } from '@models/organization'
import { AchievementModel, AchievementType } from '@models/achievement'
import { CodeLinesRankingsDtos, MonthStarryPeopleDto, RankingsDtos } from '@dtos/rankings.dtos'
import { CodeLinesDtos, CodeLinesSummary } from '@dtos/codeLines.dtos'
import { CodeLineDiff } from '@models/CodeLineDiff'

describe('OrganizationService 클래스', () => {
    const sut = new OrganizationService()

    let organization: Organization
    let adminScoreDtos: ScoreDtos

    mockingAxios()

    setTestDB(async () => {
        organization = await OrganizationModel.saveOrganization(
            testClientId,
            testClientSecret,
            testSpaceURL,
            testOrganizationAdminId,
            testWebhooks,
            null,
        )
        await AchievementModel.saveAchievement({
            clientId: testClientId,
            user: testOrganizationAdminId,
            issueId: testIssueId,
            type: AchievementType.CreateCodeReview,
        })
        await AchievementModel.saveAchievement({
            clientId: testClientId,
            user: testOrganizationAdminId,
            issueId: testIssueId + 1,
            type: AchievementType.CreateCodeReview,
        })
        await CodeLineDiff.saveCodeLineDiff({
            clientId: testClientId,
            user: testOrganizationAdminId,
            projectId: testProjectId,
            reviewId: testReviewId,
            repository: 'test',
            mergedAt: new Date(),
            added: 2,
            deleted: 2,
        })
        await CodeLineDiff.saveCodeLineDiff({
            clientId: testClientId,
            user: testUserId,
            projectId: testProjectId,
            reviewId: testReviewId,
            repository: 'test',
            mergedAt: new Date(),
            added: 1,
            deleted: 1,
        })

        const achievementCounts = new AchievementCount()
        achievementCounts.createCodeReview = 2
        adminScoreDtos = new ScoreDtos(organization.points, achievementCounts)
    })

    describe('getStarryPeopleInOrganization 메소드에서', () => {
        it('조직의 별을 가장 많이 받은 사람을 반환한다.', async () => {
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testUserId,
                issueId: testIssueId,
                type: AchievementType.ReceiveStar,
            })
            const from = new Date()
            from.setTime(from.getTime() - 1000)
            const to = new Date()

            const result = await sut.getStarryPeopleInOrganization(testSpaceURL, from, to)

            expect(result.length).toBe(1)
            expect(result[0]).toStrictEqual(
                new MonthStarryPeopleDto(
                    {
                        year: from.getFullYear(),
                        month: from.getMonth() + 1,
                    },
                    testUserId,
                    ` ${testUserName}`,
                    1,
                    testProfilePicture,
                ),
            )
        })
    })

    describe('getRankingsInOrganization 메소드에서', () => {
        it('조직의 랭킹을 반환한다.', async () => {
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testUserId,
                issueId: testIssueId,
                type: AchievementType.CreateIssue,
            })
            const from = new Date()
            from.setTime(from.getTime() - 1000)
            const to = new Date()

            const result = await sut.getRankingsInOrganization(organization, from, to, 10)

            expect(result.size).toBe(2)

            expect(result.rankings[0]).toStrictEqual(
                new RankingsDtos(testOrganizationAdminId, ` ${testAdminName}`, adminScoreDtos, testProfilePicture),
            )
            const achievementCounts = new AchievementCount()
            achievementCounts.createIssue = 1
            expect(result.rankings[1]).toStrictEqual(
                new RankingsDtos(testUserId, ` ${testUserName}`, new ScoreDtos(organization.points, achievementCounts), testProfilePicture),
            )
        })
    })

    describe('getCodeLinesRankingsInOrganization 메소드에서', () => {
        it('조직의 코드라인 랭킹을 반환한다.', async () => {
            const from = new Date()
            from.setTime(from.getTime() - 1000)
            const to = new Date()

            const result = await sut.getCodeLinesRankingsInOrganization(organization, from, to, 10)

            expect(result.size).toBe(2)
            let codeLines = new CodeLinesSummary()
            codeLines.addedLines = 2
            codeLines.deletedLines = 2
            expect(result.codeLines[0]).toStrictEqual(
                new CodeLinesRankingsDtos(testOrganizationAdminId, ` ${testAdminName}`, new CodeLinesDtos(codeLines), testProfilePicture),
            )
            codeLines = new CodeLinesSummary()
            codeLines.addedLines = 1
            codeLines.deletedLines = 1
            expect(result.codeLines[1]).toStrictEqual(
                new CodeLinesRankingsDtos(testUserId, ` ${testUserName}`, new CodeLinesDtos(codeLines), testProfilePicture),
            )
        })
    })

    describe('getOrganizationScore 메소드에서', () => {
        it('조직의 점수를 반환한다.', async () => {
            const from = new Date()
            from.setTime(from.getTime() - 1000)
            const to = new Date()

            const result = await sut.getOrganizationScore(organization, from, to)

            expect(result.score).toStrictEqual(adminScoreDtos)
        })
    })

    describe('getOrganizationScoreList 메소드에서', () => {
        it('조직의 점수 리스트를 반환한다.', async () => {
            const from = new Date()
            from.setTime(from.getTime() - 1000)
            const to = new Date()

            const result = await sut.getOrganizationScoreList(organization, from, to)

            expect(Object.keys(result).length).toBe(1)
            expect(result[Object.keys(result)[0]]).toStrictEqual(adminScoreDtos)
        })
    })
})
