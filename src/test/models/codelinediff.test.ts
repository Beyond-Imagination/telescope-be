import { setTestDB, testClientId, testOrganizationAdminId, testProjectId, testRepositoryId, testReviewId, testUserId } from '@/test/test.util'
import { CodeLineDiffModel } from '@models/CodeLineDiff'
import { getDaysBefore } from '@utils/date'

describe('CodeLineDiff 클래스', () => {
    setTestDB()

    describe('saveCodeLineDiff 메소드에서', () => {
        it('항상 성공한다', async () => {
            await expect(
                CodeLineDiffModel.saveCodeLineDiff({
                    clientId: testClientId,
                    user: testUserId,
                    projectId: testProjectId,
                    reviewId: testReviewId,
                    repository: testRepositoryId,
                    added: 100,
                    deleted: 100,
                }),
            ).resolves.not.toThrow()

            await expect(CodeLineDiffModel.countDocuments({}).exec()).resolves.toBe(1)
        })
    })

    describe('getRankingsByClientId 메소드에서', () => {
        it('Organization의 CodeLineDiff 순위를 반환한다', async () => {
            await CodeLineDiffModel.saveCodeLineDiff({
                clientId: testClientId,
                user: testUserId,
                projectId: testProjectId,
                reviewId: testReviewId + '2',
                repository: testRepositoryId,
                added: 50,
                deleted: 50,
            })
            await CodeLineDiffModel.saveCodeLineDiff({
                clientId: testClientId,
                user: testUserId,
                projectId: testProjectId,
                reviewId: testReviewId + '2',
                repository: testRepositoryId,
                added: 51,
                deleted: 50,
            })
            await CodeLineDiffModel.saveCodeLineDiff({
                clientId: testClientId,
                user: testOrganizationAdminId,
                projectId: testProjectId,
                reviewId: testReviewId + '1',
                repository: testRepositoryId,
                added: 100,
                deleted: 100,
            })
            const result = (await CodeLineDiffModel.getRankingsByClientId(testClientId, getDaysBefore(7), new Date())).sort(
                (a, b) => b.addedLines + b.deletedLines - a.addedLines - a.deletedLines,
            )
            expect(result).toEqual([
                {
                    _id: testUserId,
                    addedLines: 101,
                    deletedLines: 100,
                },
                {
                    _id: testOrganizationAdminId,
                    addedLines: 100,
                    deletedLines: 100,
                },
            ])
        })
    })

    describe('getUserCodeLinesByClientId 메소드에서', () => {
        it('유저의 CodeLineDiff 합을 반환한다', async () => {
            await CodeLineDiffModel.saveCodeLineDiff({
                clientId: testClientId,
                user: testUserId,
                projectId: testProjectId,
                reviewId: testReviewId + '2',
                repository: testRepositoryId,
                added: 50,
                deleted: 50,
            })
            await CodeLineDiffModel.saveCodeLineDiff({
                clientId: testClientId,
                user: testUserId,
                projectId: testProjectId,
                reviewId: testReviewId + '2',
                repository: testRepositoryId,
                added: 51,
                deleted: 50,
            })
            await expect(CodeLineDiffModel.getUserCodeLinesByClientId(testClientId, getDaysBefore(7), new Date(), testUserId)).resolves.toEqual([
                {
                    addedLines: 101,
                    deletedLines: 100,
                },
            ])
        })
    })
})
