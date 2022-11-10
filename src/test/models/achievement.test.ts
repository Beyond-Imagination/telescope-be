import { setTestDB, testAdmin, testClientId, testIssueId } from '@/test/testUtils'
import { AchievementModel, AchievementType } from '@models/achievement'
import { getDaysBefore } from '@utils/date'

describe('Achievement 클래스', () => {
    setTestDB(async () => await AchievementModel.saveAchievement(testClientId, testAdmin, testIssueId, AchievementType.CreateCodeReview))

    describe('saveAchievement 메소드에서', () => {
        it('항상 성공한다', async () => {
            await expect(
                AchievementModel.saveAchievement(testClientId, testAdmin, 'testIssueId2', AchievementType.CreateCodeReview),
            ).resolves.not.toThrow()
        })
    })

    describe('getOrganizationScoreByClientId 메소드에서', () => {
        it('존재하지 않는 ClientId 검색하면 0개의 자료가 반환된다', async () => {
            expect((await AchievementModel.getOrganizationScoreByClientId('not exist clienID', getDaysBefore(7), new Date())).length).toEqual(0)
        })

        it('존재하는 ClientId 검색하면 1개 이상의 자료가 반환된다', async () => {
            expect((await AchievementModel.getOrganizationScoreByClientId(testClientId, getDaysBefore(7), new Date())).length).toBeGreaterThanOrEqual(
                1,
            )
        })
    })

    describe('getRankingsByClientId 메소드에서', () => {
        it('존재하지 않는 ClientId 검색하면 0개의 자료가 반환된다', async () => {
            expect((await AchievementModel.getRankingsByClientId('not exist clienID', getDaysBefore(7), new Date())).length).toEqual(0)
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
                AchievementModel.deleteAchievement(testClientId, testAdmin, testIssueId, AchievementType.CreateCodeReview),
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
})
