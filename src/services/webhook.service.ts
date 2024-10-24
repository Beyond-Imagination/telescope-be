import { Achievement, AchievementModel, AchievementType } from '@models/achievement'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { Organization } from '@models/organization'
import { CodeReviewDiscussionDTO, CodeReviewDTO, IssueDTO, ReactionDTO, ReviewerReviewDTO } from '@dtos/webhooks.dtos'
import { SpaceClient } from '@/client/space.client'
import { StarService } from '@services/star.service'
import { CodeLineDiff } from '@models/CodeLineDiff'

export class WebhookService {
    spaceClient = SpaceClient.getInstance()
    starService: StarService = StarService.getInstance()

    public async createIssue(issueDTO: IssueDTO) {
        await AchievementModel.saveAchievement({
            clientId: issueDTO.clientId,
            user: issueDTO.payload.meta.principal.details.user.id,
            projectId: issueDTO.payload.issue.projectId,
            issueId: issueDTO.payload.issue.id,
            type: AchievementType.CreateIssue,
        })

        if (issueDTO.payload.status.new.resolved && issueDTO.payload.assignee?.new.id) {
            // 할당된 유저가 없을수도 있음
            // 생성하면서 동시에 resolve 될수도 있음
            await AchievementModel.saveAchievement({
                clientId: issueDTO.clientId,
                user: issueDTO.payload.assignee.new.id,
                projectId: issueDTO.payload.issue.projectId,
                issueId: issueDTO.payload.issue.id,
                type: AchievementType.ResolveIssue,
            })
        }
    }

    public async updateIssueStatus(issueDTO: IssueDTO) {
        const assignee = issueDTO.payload.issue.assignee

        if (assignee) {
            if (issueDTO.isResolved()) {
                await AchievementModel.saveAchievement({
                    clientId: issueDTO.clientId,
                    user: assignee.id,
                    projectId: issueDTO.payload.issue.projectId,
                    issueId: issueDTO.payload.issue.id,
                    type: AchievementType.ResolveIssue,
                })
            } else if (issueDTO.isUnresolved()) {
                await AchievementModel.deleteAchievement(issueDTO.clientId, assignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
            }
        }
    }

    public async updateIssueAssignee(issueDTO: IssueDTO) {
        if (issueDTO.checkResolved()) {
            const newAssignee = issueDTO.payload.assignee.new
            const oldAssignee = issueDTO.payload.assignee.old

            if (newAssignee) {
                // issue가 unassigned되는 케이스를 방어한다
                await AchievementModel.saveAchievement({
                    clientId: issueDTO.clientId,
                    user: newAssignee.id,
                    projectId: issueDTO.payload.issue.projectId,
                    issueId: issueDTO.payload.issue.id,
                    type: AchievementType.ResolveIssue,
                })
            }
            if (oldAssignee) {
                // 기존에 issue가 unassigned되어있는 경우를 방어한다
                await AchievementModel.deleteAchievement(issueDTO.clientId, oldAssignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
            }
        }
    }

    // 이슈의 프로젝트를 옮기면서 한번에 assignee와 이슈 상태를 바꿀수 있다
    public async updateIssueProject(issueDTO: IssueDTO) {
        const achievements = await AchievementModel.getAchievementByIssueId(issueDTO.clientId, issueDTO.payload.issue.id)
        const promises = []
        achievements.forEach(achievement => {
            if (achievement.type === AchievementType.CreateIssue) {
                // 기존의 assignee가 이슈 생성이라면 생성한 원래의 유저에게 점수를 준다
                promises.push(AchievementModel.updateOne({ _id: achievement._id }, { projectId: issueDTO.payload.issue.projectId }))
            } else if (achievement.type === AchievementType.ResolveIssue && issueDTO.checkResolved()) {
                // 기존에 ResolveIssue로 achievement가 있었어도 현재 이슈의 상태도 resolved 일때만 점수를 준다
                // 이때는 assignee도 바뀔수가 있어서 웹훅으로 들어오는 데이터를 사용한다
                promises.push(
                    AchievementModel.updateOne(
                        { _id: achievement._id },
                        {
                            user: issueDTO.payload.issue.assignee.id,
                            projectId: issueDTO.payload.issue.projectId,
                        },
                    ),
                )
            } else {
                // 나머지는 그냥 삭제
                promises.push(AchievementModel.deleteAchievement(achievement.clientId, achievement.user, achievement.issueId, achievement.type))
            }
        })
        await Promise.all(promises)
    }

    public async deleteIssue(issueDTO: IssueDTO) {
        const assignee = issueDTO.payload.issue.assignee
        if (assignee && issueDTO.checkResolved()) {
            await AchievementModel.deleteAchievement(issueDTO.clientId, assignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
        }
    }

    public async handleCodeReviewWebHook(codeReviewDTO: CodeReviewDTO, organization: Organization, axiosOption: any, isOpen: boolean) {
        if (codeReviewDTO.payload.className !== 'CodeReviewWebhookEvent') {
            throw new WrongClassNameException()
        }
        // 특정 사용자가 생성한 MR이 아니면 점수는 누구에게도 할당되지 않도록한다.
        if (codeReviewDTO.payload.review.createdBy?.id) {
            if (isOpen) {
                await Achievement.saveAchievement({
                    clientId: codeReviewDTO.clientId,
                    user: codeReviewDTO.payload.review.createdBy.id,
                    projectId: codeReviewDTO.payload.review?.projectId,
                    reviewId: codeReviewDTO.payload.review.id,
                    repository: codeReviewDTO.payload.repository,
                    type: AchievementType.CreateCodeReview,
                })
            } else if (codeReviewDTO.payload.review.className === 'MergeRequestRecord' && codeReviewDTO.payload.review.branchPairs[0]?.isMerged) {
                // MR이면서 머지가 됐을때만 저장한다

                const commitDiff = await this.spaceClient.getCommitFilesDiff(
                    organization.serverUrl,
                    codeReviewDTO.payload.review.project.key,
                    codeReviewDTO.payload.review.id,
                    axiosOption.headers,
                )
                await Promise.all([
                    Achievement.saveAchievement({
                        clientId: codeReviewDTO.clientId,
                        user: codeReviewDTO.payload.review.createdBy.id,
                        projectId: codeReviewDTO.payload.review.projectId,
                        reviewId: codeReviewDTO.payload.review.id,
                        repository: codeReviewDTO.payload.repository,
                        type: AchievementType.MergeMr,
                    }),
                    CodeLineDiff.saveCodeLineDiff({
                        clientId: codeReviewDTO.clientId,
                        user: codeReviewDTO.payload.review.createdBy.id,
                        projectId: codeReviewDTO.payload.review.projectId,
                        reviewId: codeReviewDTO.payload.review.id,
                        repository: codeReviewDTO.payload.repository,

                        // commitDiff.data : not null
                        // commitDiff.data.change : not null
                        // commitDiff.data.change.diffSize : 바이너리 파일일 경우 null
                        added: commitDiff.data.reduce((prev, curr) => prev + (curr.change.diffSize ? curr.change.diffSize.added : 0), 0),
                        deleted: commitDiff.data.reduce((prev, curr) => prev + (curr.change.diffSize ? curr.change.diffSize.deleted : 0), 0),
                    }),
                ])
            }
        }
    }

    async createCodeReviewDiscussion(payload: CodeReviewDiscussionDTO) {
        await Achievement.saveAchievement({
            clientId: payload.clientId,
            user: payload.payload.meta.principal.details.user.id,
            discussionId: payload.payload.discussion.discussion.id,
            reviewId: payload.payload.review.id,
            type: AchievementType.CodeReviewDiscussion,
        })
    }

    async removeCodeReviewDiscussion(payload: CodeReviewDiscussionDTO) {
        await Achievement.deleteCodeReviewDiscussionAchievement(payload.clientId, payload.payload.discussion.discussion.id, payload.payload.review.id)
    }

    async handleReviewerAcceptedChangesWebhook(payload: ReviewerReviewDTO) {
        if (payload.payload.reviewerState?.new === 'Accepted' && payload.payload.reviewerState?.old !== 'Accepted') {
            await Achievement.saveAchievement({
                clientId: payload.clientId,
                user: payload.payload.meta.principal.details.user.id,
                reviewId: payload.payload.review.id,
                type: AchievementType.AcceptCodeReview,
            })
        }
    }

    async handleReviewerResumeReviewWebhook(payload: ReviewerReviewDTO) {
        if (payload.payload.reviewerState?.old === 'Accepted' && payload.payload.reviewerState?.new !== 'Accepted') {
            await Achievement.deleteReviewerAcceptedChangesAchievement(
                payload.clientId,
                payload.payload.review.id,
                payload.payload.meta.principal.details.user.id,
            )
        }
    }

    async handleAddMessageReactionWebhook(payload: ReactionDTO, organization: Organization, axiosOption: any) {
        if (payload.className !== 'WebhookRequestPayload' || payload.payload.className !== 'ChatMessageReactionAddedEvent') {
            throw new WrongClassNameException()
        }

        const author = (
            await this.spaceClient.getMessageInfo(organization.serverUrl, payload.payload.messageId, payload.payload.channelId, axiosOption)
        ).data.author

        return await this.starService.addPointToAuthor(
            organization.serverUrl,
            organization.clientId,
            payload.payload.actor.details.user.id,
            payload.payload.messageId,
            author,
            axiosOption,
        )
    }

    async handleRemoveMessageReactionWebhook(payload: ReactionDTO, organization: Organization, axiosOption: any) {
        if (payload.className !== 'WebhookRequestPayload' || payload.payload.className !== 'ChatMessageReactionRemovedEvent') {
            throw new WrongClassNameException()
        }

        return await this.starService.deletePoint(
            organization.serverUrl,
            organization.clientId,
            payload.payload.messageId,
            payload.payload.actor.details.user.id,
            axiosOption,
        )
    }
}
