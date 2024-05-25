import {
    setTestDB,
    testClientId,
    testDiscussionId,
    testIssueId,
    testMessageId,
    testOrganizationAdminId,
    testReviewId,
    testUserId,
} from '@/test/test.util'
import { AchievementModel, AchievementType } from '@models/achievement'
import { getDaysBefore, getMonthsBefore } from '@utils/date'
import moment from 'moment-timezone'

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

    describe('getAchievementByIssueId 메소드에서', () => {
        it('존재하지 않는 IssueId 검색하면 0개의 자료가 반환된다', async () => {
            expect((await AchievementModel.getAchievementByIssueId(testClientId, 'not exist issueId')).length).toEqual(0)
        })

        it('존재하는 IssueId 검색하면 해당 IssueId에 대한 Achievement 정보가 조회된다', async () => {
            const result = await AchievementModel.getAchievementByIssueId(testClientId, testIssueId)
            expect(result.length).toEqual(1)
            expect(result[0].clientId).toEqual(testClientId)
            expect(result[0].user).toEqual(testUserId)
            expect(result[0].issueId).toEqual(testIssueId)
        })
    })

    describe('getOrganizationScoreListByClientId 메소드에서', () => {
        it('7일치를 검색하면 정확하게 7일의 데이터만 aggregate한 결과가 반환된다.', async () => {
            await expect(AchievementModel.getOrganizationScoreListByClientId(testClientId, getDaysBefore(7), new Date())).resolves.toEqual([
                {
                    _id: {
                        clientId: testClientId,
                        date: getDaysBefore(6).toISOString().substring(0, 10),
                    },
                    acceptCodeReview: 0,
                    codeReviewDiscussion: 0,
                    createCodeReview: 1,
                    createIssue: 0,
                    mergeMr: 0,
                    receiveStar: 0,
                    resolveIssue: 0,
                },
                {
                    _id: {
                        clientId: testClientId,
                        date: getDaysBefore(0).toISOString().substring(0, 10),
                    },
                    acceptCodeReview: 0,
                    codeReviewDiscussion: 0,
                    createCodeReview: 1,
                    createIssue: 0,
                    mergeMr: 0,
                    receiveStar: 0,
                    resolveIssue: 0,
                },
            ])
        })
    })

    describe('getOrganizationScoreByClientId 메소드에서', () => {
        it('존재하지 않는 ClientId 검색하면 0개의 자료가 반환된다', async () => {
            expect((await AchievementModel.getOrganizationScoreByClientId('not exist clientID', getDaysBefore(7), new Date())).length).toEqual(0)
        })

        it('존재하는 ClientId 검색하면 Organization의 점수 통계 정보가 조회된다', async () => {
            await expect(AchievementModel.getOrganizationScoreByClientId(testClientId, getDaysBefore(7), new Date())).resolves.toEqual([
                {
                    acceptCodeReview: 0,
                    codeReviewDiscussion: 0,
                    createCodeReview: 2,
                    createIssue: 0,
                    mergeMr: 0,
                    receiveStar: 0,
                    resolveIssue: 0,
                },
            ])
        })
    })

    describe('getRankingsByClientId 메소드에서', () => {
        it('존재하지 않는 ClientId 검색하면 0개의 자료가 반환된다', async () => {
            expect((await AchievementModel.getRankingsByClientId('not exist clientID', getDaysBefore(7), new Date())).length).toEqual(0)
        })

        it('존재하는 ClientId 검색하면 Organization의 점수 랭킹 정보가 조회된다', async () => {
            await expect(AchievementModel.getRankingsByClientId(testClientId, getDaysBefore(7), new Date())).resolves.toEqual([
                {
                    _id: testUserId,
                    acceptCodeReview: 0,
                    codeReviewDiscussion: 0,
                    createCodeReview: 2,
                    createIssue: 0,
                    mergeMr: 0,
                    receiveStar: 0,
                    resolveIssue: 0,
                },
            ])
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

    describe('insertStar 메소드에서', () => {
        it('DB에 데이터가 들어간다', async () => {
            await AchievementModel.deleteAllByClientId(testClientId, null)
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId)
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(1)
        })

        it('이미 존재하는 데이터를 다시 insert하면 다시 저장하지 않는다', async () => {
            await AchievementModel.deleteAllByClientId(testClientId, null)
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId)
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId)
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(1)
        })
    })

    describe('deleteStar 메소드에서', () => {
        it('DB의 데이터가 삭제된다', async () => {
            await AchievementModel.deleteAllByClientId(testClientId, null)
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId)
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(1)
            await AchievementModel.deleteStar(testClientId, testOrganizationAdminId, testMessageId)
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
        })
    })

    describe('deleteCodeReviewDiscussionAchievement 메소드에서', () => {
        it('DB의 데이터가 삭제된다', async () => {
            await AchievementModel.deleteAllByClientId(testClientId, null)
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testUserId,
                discussionId: testDiscussionId,
                reviewId: testReviewId,
                type: AchievementType.CodeReviewDiscussion,
            })

            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(1)
            await AchievementModel.deleteCodeReviewDiscussionAchievement(testClientId, testDiscussionId, testReviewId)
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
        })
    })

    describe('deleteReviewerAcceptedChangesAchievement 메소드에서', () => {
        it('DB의 데이터가 삭제된다', async () => {
            await AchievementModel.deleteAllByClientId(testClientId, null)
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testUserId,
                reviewId: testReviewId,
                type: AchievementType.AcceptCodeReview,
            })

            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(1)
            await AchievementModel.deleteReviewerAcceptedChangesAchievement(testClientId, testReviewId, testUserId)
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
        })
    })

    describe('getStarCountByUserId 메소드에서', () => {
        it('기간동안 유저가 받은 star 개수를 반환한다', async () => {
            await new AchievementModel({
                clientId: testClientId,
                user: testUserId,
                starGiver: testOrganizationAdminId,
                messageId: testMessageId,
                type: AchievementType.ReceiveStar,
                achievedAt: getDaysBefore(8),
            }).save()
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId + '1')
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId + '2')
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId + '3')
            await expect(AchievementModel.getStarCountByUserId(testClientId, getDaysBefore(7), new Date(), testUserId)).resolves.toBe(3)
        })
    })

    describe('getRemainStarCountByUserId 메소드에서', () => {
        it('하루 할당량 5개 중에 남은 star 보내는 횟수를 반환한다', async () => {
            const startOfDay = moment().startOf('day').toDate()
            const endOfDay = moment().endOf('day').toDate()
            await new AchievementModel({
                clientId: testClientId,
                user: testUserId,
                starGiver: testOrganizationAdminId,
                messageId: testMessageId,
                type: AchievementType.ReceiveStar,
                achievedAt: getDaysBefore(1),
            }).save()
            await AchievementModel.insertStar(testClientId, testOrganizationAdminId, testUserId, testMessageId + '1')
            await AchievementModel.insertStar(testClientId, testOrganizationAdminId, testUserId, testMessageId + '2')
            await AchievementModel.insertStar(testClientId, testOrganizationAdminId, testUserId, testMessageId + '3')
            await expect(AchievementModel.getRemainStarCountByUserId(testClientId, startOfDay, endOfDay, testUserId)).resolves.toBe(2)
        })
    })

    describe('getUserScoreByClientId 메소드에서', () => {
        it('7일치를 검색하면 정확하게 7일의 데이터만 aggregate한 결과가 반환된다.', async () => {
            await expect(AchievementModel.getUserScoreByClientId(testClientId, getDaysBefore(7), new Date(), testUserId)).resolves.toEqual([
                {
                    acceptCodeReview: 0,
                    codeReviewDiscussion: 0,
                    createCodeReview: 2,
                    createIssue: 0,
                    mergeMr: 0,
                    receiveStar: 0,
                    resolveIssue: 0,
                },
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

    describe('getMostStarPeopleByClientId 메소드에서', () => {
        it('각 월의 최다 star를 받은 사람을 반환한다', async () => {
            const fromDate = moment(getMonthsBefore(1)).startOf('month').toDate()
            const toDate = moment(getMonthsBefore(0)).endOf('month').toDate()

            // 지난달에 어드민이 2건 받았고 testUserId가 0건 받았다
            // 이번달에 testUserId가 2건 받았고 어드민이 1건 받았다
            await new AchievementModel({
                clientId: testClientId,
                user: testOrganizationAdminId,
                starGiver: testUserId,
                messageId: testMessageId,
                type: AchievementType.ReceiveStar,
                achievedAt: getMonthsBefore(1),
            }).save()
            await new AchievementModel({
                clientId: testClientId,
                user: testOrganizationAdminId,
                starGiver: testUserId,
                messageId: testMessageId,
                type: AchievementType.ReceiveStar,
                achievedAt: getMonthsBefore(1),
            }).save()
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId + '1')
            await AchievementModel.insertStar(testClientId, testUserId, testOrganizationAdminId, testMessageId + '2')
            await AchievementModel.insertStar(testClientId, testOrganizationAdminId, testUserId, testMessageId + '3')
            const result = (await AchievementModel.getMostStarPeopleByClientId(testClientId, fromDate, toDate)).sort(
                (a, b) => a._id.month - b._id.month,
            )
            expect(result).toEqual([
                {
                    _id: {
                        month: fromDate.getMonth() + 1,
                        year: fromDate.getFullYear(),
                    },
                    score: 2,
                    userId: testOrganizationAdminId,
                },
                {
                    _id: {
                        month: toDate.getMonth() + 1,
                        year: toDate.getFullYear(),
                    },
                    score: 2,
                    userId: testUserId,
                },
            ])
        })
    })
})
