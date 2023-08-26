import { setTestDB, testClientId, testIssueId, testUserId } from '@/test/test.util'
import { AchievementModel, AchievementType } from '@models/achievement'
import { getDaysBefore } from '@utils/date'

describe('Achievement 클래스', () => {
    setTestDB(async () => {
        await AchievementModel.saveAchievement({
            clientId: testClientId,
            user: testUserId,
            issueId: testIssueId,
            type: AchievementType.CreateCodeReview,
        })

        await new AchievementModel({
            ...{
                clientId: testClientId,
                user: testUserId,
                issueId: testIssueId + 'before6',
                type: AchievementType.CreateCodeReview,
            },
            achievedAt: getDaysBefore(6),
        }).save()
        await new AchievementModel({
            ...{
                clientId: testClientId,
                user: testUserId,
                issueId: testIssueId + 'before7',
                type: AchievementType.CreateCodeReview,
            },
            achievedAt: getDaysBefore(7),
        }).save()
    })

    describe('saveAchievement 메소드에서', () => {
        it('항상 성공한다', async () => {
            await expect(
                AchievementModel.saveAchievement({
                    clientId: testClientId,
                    user: testUserId,
                    issueId: 'testIssueId2',
                    type: AchievementType.CreateCodeReview,
                }),
            ).resolves.not.toThrow()
        })
    })

    describe('getOrganizationScoreByClientId 메소드에서', () => {
        it('존재하지 않는 ClientId 검색하면 0개의 자료가 반환된다', async () => {
            expect((await AchievementModel.getOrganizationScoreByClientId('not exist clientID', getDaysBefore(7), new Date())).length).toEqual(0)
        })

        it('존재하는 ClientId 검색하면 1개 이상의 자료가 반환된다', async () => {
            expect((await AchievementModel.getOrganizationScoreByClientId(testClientId, getDaysBefore(7), new Date())).length).toBeGreaterThanOrEqual(
                1,
            )
        })
    })

    describe('getRankingsByClientId 메소드에서', () => {
        it('존재하지 않는 ClientId 검색하면 0개의 자료가 반환된다', async () => {
            expect((await AchievementModel.getRankingsByClientId('not exist clientID', getDaysBefore(7), new Date())).length).toEqual(0)
        })

        it('존재하는 ClientId 검색하면 1개 이상의 자료가 반환된다', async () => {
            expect((await AchievementModel.getRankingsByClientId(testClientId, getDaysBefore(7), new Date())).length).toBeGreaterThanOrEqual(1)
        })
    })

    describe('deleteAchievement 메소드에서', () => {
        it('항상 성공한다', async () => {
            // 삭제 하기 이전에는 조회가 성공해야한다.
            expect((await AchievementModel.getOrganizationScoreByClientId(testClientId, getDaysBefore(7), new Date())).length).toEqual(1)

            await expect(
                Promise.all([
                    AchievementModel.deleteAchievement(testClientId, testUserId, testIssueId, AchievementType.CreateCodeReview),
                    AchievementModel.deleteAchievement(testClientId, testUserId, testIssueId + 'before6', AchievementType.CreateCodeReview),
                ]),
            ).resolves.not.toThrow()
            //삭제한 이후에 조회하면 0개가 반환되어야 한다
            expect((await AchievementModel.getOrganizationScoreByClientId(testClientId, getDaysBefore(7), new Date())).length).toEqual(0)
        })
    })

    describe('deleteAllByClientId 메소드에서', () => {
        it('항상 성공한다', async () => {
            // 삭제 하기 이전에는 조회가 성공해야한다.
            expect((await AchievementModel.getOrganizationScoreByClientId(testClientId, getDaysBefore(7), new Date())).length).toBeGreaterThanOrEqual(
                1,
            )

            await expect(AchievementModel.deleteAllByClientId(testClientId, null)).resolves.not.toThrow()

            //삭제한 이후에 조회하면 0개가 반환되어야 한다
            expect((await AchievementModel.getOrganizationScoreByClientId(testClientId, getDaysBefore(7), new Date())).length).toEqual(0)
        })
    })

    describe('getUserScoreByClientId 메소드에서', () => {
        it('7일치를 검색하면 정확하게 7일의 데이터만 aggregate한 결과가 반환된다.', async () => {
            await expect(AchievementModel.getUserScoreByClientId(testClientId, getDaysBefore(7), new Date(), testUserId)).resolves.toEqual([
                { acceptCodeReview: 0, codeReviewDiscussion: 0, createCodeReview: 2, createIssue: 0, mergeMr: 0, receiveStar: 0, resolveIssue: 0 },
            ])
        })
    })

    describe('getUserScoreByClientIdGroupByDate 메소드에서', () => {
        it('7일치를 검색하면 정확하게 7일의 데이터 중에 acheivement가 1개라도 존재하는 날짜만 날짜별 총 점수 리스트가 반환된다', async () => {
            await expect(
                AchievementModel.getUserScoreByClientIdGroupByDate(testClientId, getDaysBefore(7), new Date(), testUserId),
            ).resolves.toHaveLength(2)
        })
    })
})
