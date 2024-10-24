import { WebhookService } from '@services/webhook.service'
import {
    getTestAxiosOption,
    mockingAxios,
    mockOrganization,
    setTestDB,
    testChannelId,
    testClientId,
    testClientSecret,
    testDiscussionId,
    testIssueId,
    testMessageId,
    testOrganizationAdminId,
    testReviewId,
    testSpaceURL,
    testUserId,
    testWebhookId,
    testWebhooks,
} from '@/test/test.util'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { OrganizationModel } from '@models/organization'
import { CodeReviewDiscussionDTO, ReactionDTO, ReviewerReviewDTO } from '@dtos/webhooks.dtos'
import { Achievement, AchievementModel, AchievementType } from '@models/achievement'

describe('WebhookService 클래스', () => {
    const sut = new WebhookService()
    let codeReviewDto, issueDto
    let reactionDto: ReactionDTO
    let codeReviewDiscussionDto: CodeReviewDiscussionDTO
    let reviewerReviewDto: ReviewerReviewDTO
    const starGiver = 'starGiver'
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    mockingAxios()

    setTestDB(async () => {
        await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdminId, testWebhooks, null)
        codeReviewDto = {
            clientId: testClientId,
            payload: {
                className: 'CodeReviewWebhookEvent',
                review: {
                    id: testIssueId,
                    project: {
                        key: '',
                    },
                    projectId: '',
                    branchPairs: [
                        {
                            isMerged: '',
                        },
                    ],
                    createdBy: {
                        id: '',
                    },
                },
                repository: '',
            },
            verificationToken: '',
            webhookId: testWebhookId,
        }

        issueDto = {
            clientId: testClientId,
            payload: {
                className: 'IssueWebhookEvent',
                meta: {
                    principal: {
                        details: {
                            user: {
                                id: testUserId,
                            },
                        },
                    },
                },
                issue: {
                    id: testIssueId,
                    assignee: {
                        id: testUserId,
                    },
                    status: {
                        resolved: '',
                    },
                },
                status: {
                    old: {
                        resolved: '',
                    },
                    new: {
                        resolved: '',
                    },
                },
                assignee: {
                    old: {
                        id: '',
                    },
                    new: {
                        id: '',
                    },
                },
            },
            isResolved(): boolean {
                return !this.payload.status.old.resolved && this.payload.status.new.resolved
            },

            isUnresolved(): boolean {
                return this.payload.status.old.resolved && !this.payload.status.new.resolved
            },

            checkResolved(): boolean {
                return this.payload.issue.status.resolved
            },
        }

        reactionDto = {
            className: 'WebhookRequestPayload',

            clientId: testClientId,

            payload: {
                className: 'ChatMessageReactionAddedEvent',
                emoji: 'star',
                messageId: testMessageId,
                channelId: testChannelId,
                actor: {
                    details: {
                        user: { id: starGiver },
                    },
                },
            },
        }
        codeReviewDiscussionDto = {
            clientId: testClientId,
            payload: {
                className: 'CodeReviewDiscussionWebhookEvent',
                discussion: {
                    discussion: {
                        id: testDiscussionId,
                    },
                },
                meta: {
                    principal: {
                        details: {
                            user: {
                                id: testUserId,
                            },
                        },
                    },
                },
                review: {
                    id: testReviewId,
                },
            },
        }
        reviewerReviewDto = {
            clientId: testClientId,
            payload: {
                className: 'CodeReviewParticipantWebhookEvent',
                meta: {
                    principal: {
                        details: {
                            user: {
                                id: testUserId,
                            },
                        },
                    },
                },
                review: {
                    id: testReviewId,
                },
                isMergeRequest: true,
                reviewerState: {
                    old: null,
                    new: 'Accepted',
                },
            },
        }
    })

    describe('handleCodeReviewWebHook 메소드에서', () => {
        describe('코드리뷰가 생성될때', () => {
            it('className이 CodeReviewWebhookEvent가 아니면 에러가 발생한다', async () => {
                codeReviewDto.payload.className = 'whatever'
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, mockOrganization, getTestAxiosOption(), true)).rejects.toThrowError(
                    WrongClassNameException,
                )
            })

            it('정상적인 요청이면 성공한다', async () => {
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, mockOrganization, getTestAxiosOption(), true)).resolves.not.toThrowError()
            })
        })

        describe('MR이 머지될때', () => {
            it('className이 CodeReviewWebhookEvent가 아니면 에러가 발생한다', async () => {
                codeReviewDto.payload.className = 'whatever'
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, mockOrganization, getTestAxiosOption(), false)).rejects.toThrowError(
                    WrongClassNameException,
                )
            })

            it('정상적인 요청이면 성공한다', async () => {
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, mockOrganization, getTestAxiosOption(), false)).resolves.not.toThrowError()
            })
        })
    })

    describe('createIssue 메소드에서', () => {
        describe('이슈가 생성될 때', () => {
            it('정상적인 요청이면 성공한다', async () => {
                await expect(sut.createIssue(issueDto)).resolves.not.toThrowError()
            })
        })
    })

    describe('updateIssueStatus 메소드에서', () => {
        describe('이슈상태가 수정되었을 때', () => {
            it('이슈가 unresolve -> resolve 로 바뀌었을시 정상적인 요청이면 성공한다', async () => {
                issueDto.payload.status.new.resolved = 'whatever'
                await expect(sut.updateIssueStatus(issueDto)).resolves.not.toThrowError()
            })

            it('이슈가 resolve -> unresolve 로 바뀌었을시 정상적인 요청이면 성공한다', async () => {
                issueDto.payload.status.old.resolved = 'whatever'
                await expect(sut.updateIssueStatus(issueDto)).resolves.not.toThrowError()
            })
        })
    })

    describe('updateIssueAssignee 메소드에서', () => {
        describe('이슈 담당자가 수정되었을 때', () => {
            it('이슈가 unresolve 상태면 이벤트를 무시한다', async () => {
                issueDto.payload.issue.status.resolved = false
                await expect(sut.updateIssueAssignee(issueDto)).resolves.not.toThrowError()
            })

            it('이슈가 resolve 상태면 성공한다', async () => {
                issueDto.payload.issue.status.resolved = true
                issueDto.payload.assignee.old.id = 'oldAssignee'
                issueDto.payload.assignee.new.id = 'newAssignee'
                await expect(sut.updateIssueAssignee(issueDto)).resolves.not.toThrowError()
            })
        })
    })

    describe('deleteIssue 메소드에서', () => {
        describe('이슈가 삭제되었을 때', () => {
            it('이슈가 unresolve 상태면 이벤트를 무시한다', async () => {
                issueDto.payload.issue.status.resolved = false
                await expect(sut.deleteIssue(issueDto)).resolves.not.toThrowError()
            })

            it('이슈가 resolve 상태면 성공한다', async () => {
                issueDto.payload.issue.status.resolved = true
                await expect(sut.deleteIssue(issueDto)).resolves.not.toThrowError()
            })
        })
    })

    describe('handleAddMessageReactionWebhook 메소드에서', () => {
        it('클래스명이 잘못되어 있으면 에러가 발생한다', async () => {
            reactionDto.className = 'whatever'
            await expect(sut.handleAddMessageReactionWebhook(reactionDto, mockOrganization, getTestAxiosOption())).rejects.toThrowError(
                WrongClassNameException,
            )
            reactionDto.className = 'WebhookRequestPayload'
            reactionDto.payload.className = 'whatever'
            await expect(sut.handleAddMessageReactionWebhook(reactionDto, mockOrganization, getTestAxiosOption())).rejects.toThrowError(
                WrongClassNameException,
            )
        })

        it('유효한 요청이 들어오면 점수가 추가된다', async () => {
            await sut.handleAddMessageReactionWebhook(reactionDto, mockOrganization, getTestAxiosOption())
            const now = new Date()
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, now, testUserId)).resolves.toBe(1)
        })
    })

    describe('handleRemoveMessageReactionWebhook 메소드에서', () => {
        beforeEach(async () => {
            reactionDto.payload.className = 'ChatMessageReactionRemovedEvent'
        })

        it('클래스명이 잘못되어 있으면 에러가 발생한다', async () => {
            reactionDto.className = 'whatever'
            await expect(sut.handleRemoveMessageReactionWebhook(reactionDto, mockOrganization, getTestAxiosOption())).rejects.toThrowError(
                WrongClassNameException,
            )
            reactionDto.className = 'WebhookRequestPayload'
            reactionDto.payload.className = 'whatever'
            await expect(sut.handleRemoveMessageReactionWebhook(reactionDto, mockOrganization, getTestAxiosOption())).rejects.toThrowError(
                WrongClassNameException,
            )
        })

        it('정상적으로 별을 취소하면 점수가 줄어든다', async () => {
            await Achievement.insertStar(testClientId, testUserId, starGiver, testMessageId)
            const now = new Date()
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, now, testUserId)).resolves.toBe(1)
            await sut.handleRemoveMessageReactionWebhook(reactionDto, mockOrganization, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, now, testUserId)).resolves.toBe(0)
        })
    })

    describe('createCodeReviewDiscussion 메소드에서', () => {
        it('정상적인 요청이면 성공한다', async () => {
            await expect(sut.createCodeReviewDiscussion(codeReviewDiscussionDto)).resolves.not.toThrowError()
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(1)
        })
    })

    describe('removeCodeReviewDiscussion 메소드에서', () => {
        it('정상적인 요청이면 성공한다', async () => {
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testUserId,
                discussionId: testDiscussionId,
                reviewId: testReviewId,
                type: AchievementType.CodeReviewDiscussion,
            })
            await expect(sut.removeCodeReviewDiscussion(codeReviewDiscussionDto)).resolves.not.toThrowError()
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
        })
    })

    describe('handleReviewerAcceptedChangesWebhook 메소드에서', () => {
        it('정상적인 요청이면 성공한다', async () => {
            await expect(sut.handleReviewerAcceptedChangesWebhook(reviewerReviewDto)).resolves.not.toThrowError()
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(1)
        })

        it('새로운 상태가 승인이 아니면 무시한다', async () => {
            reviewerReviewDto.payload.reviewerState.new = 'Pending'
            await expect(sut.handleReviewerAcceptedChangesWebhook(reviewerReviewDto)).resolves.not.toThrowError()
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
        })

        it('이미 받은 리뷰어가 다시 받은 리뷰를 수락하면 무시한다', async () => {
            reviewerReviewDto.payload.reviewerState.old = 'Accepted'
            await expect(sut.handleReviewerAcceptedChangesWebhook(reviewerReviewDto)).resolves.not.toThrowError()
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
        })
    })

    describe('handleReviewerResumeReviewWebhook 메소드에서', () => {
        it('정상적인 요청이면 성공한다', async () => {
            await Achievement.saveAchievement({
                clientId: testClientId,
                user: testUserId,
                reviewId: testReviewId,
                type: AchievementType.AcceptCodeReview,
            })
            reviewerReviewDto.payload.reviewerState.old = 'Accepted'
            reviewerReviewDto.payload.reviewerState.new = 'Pending'
            await expect(sut.handleReviewerResumeReviewWebhook(reviewerReviewDto)).resolves.not.toThrowError()
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
        })

        it('이전의 상태가 Accepted가 아니면 무시한다', async () => {
            reviewerReviewDto.payload.reviewerState.old = 'Pending'
            jest.spyOn(AchievementModel, 'deleteReviewerAcceptedChangesAchievement')
            await expect(sut.handleReviewerResumeReviewWebhook(reviewerReviewDto)).resolves.not.toThrowError()
            expect(AchievementModel.deleteReviewerAcceptedChangesAchievement).not.toBeCalled()
        })

        it('이미 받은 리뷰어가 다시 받은 리뷰를 수락하면 무시한다', async () => {
            reviewerReviewDto.payload.reviewerState.old = 'Accepted'
            reviewerReviewDto.payload.reviewerState.old = 'Accepted'
            jest.spyOn(AchievementModel, 'deleteReviewerAcceptedChangesAchievement')
            await expect(sut.handleReviewerResumeReviewWebhook(reviewerReviewDto)).resolves.not.toThrowError()
            expect(AchievementModel.deleteReviewerAcceptedChangesAchievement).not.toBeCalled()
        })
    })
})
