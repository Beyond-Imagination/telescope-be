import { Achievement, AchievementModel, AchievementType } from '@models/achievement'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { Organization } from '@models/organization'
import { CodeReviewDiscussionDTO, CodeReviewDTO, IssueDTO, ReactionDTO, ReviewerReviewDTO } from '@dtos/webhooks.dtos'
import { SpaceClient } from '@/client/space.client'
import { StarService } from '@services/star.service'

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

    public async deleteIssue(issueDTO: IssueDTO) {
        const assignee = issueDTO.payload.issue.assignee
        if (assignee && issueDTO.checkResolved()) {
            await AchievementModel.deleteAchievement(issueDTO.clientId, assignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
        }
    }

    public async handleCodeReviewWebHook(codeReviewDTO: CodeReviewDTO, axiosOption: any, isOpen: boolean) {
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
                await Achievement.saveAchievement({
                    clientId: codeReviewDTO.clientId,
                    user: codeReviewDTO.payload.review.createdBy.id,
                    projectId: codeReviewDTO.payload.review?.projectId,
                    reviewId: codeReviewDTO.payload.review.id,
                    repository: codeReviewDTO.payload.repository,
                    type: AchievementType.MergeMr,
                })
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
