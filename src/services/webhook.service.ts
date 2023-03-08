import { Achievement, AchievementModel, AchievementType } from '@models/achievement'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { OrganizationModel } from '@models/organization'
import { CodeReviewDTO, IssueDTO } from '@dtos/webhooks.dtos'
import { SpaceClient } from '@/client/space.client'
import { InvalidRequestException } from '@/exceptions/InvalidRequestException'

export class WebhookService {
    spaceClient = new SpaceClient()

    public async createIssue(issueDTO: IssueDTO) {
        if (issueDTO.clientId && issueDTO.payload.meta.principal.details.user.id && issueDTO.payload.issue.id) {
            await AchievementModel.saveAchievement(
                issueDTO.clientId,
                issueDTO.payload.meta.principal.details.user.id,
                issueDTO.payload.issue.id,
                AchievementType.CreateIssue,
            )
        } else {
            throw new InvalidRequestException()
        }
    }

    public async updateIssueStatus(issueDTO: IssueDTO) {
        const assignee = issueDTO.payload.issue.assignee

        if (assignee) {
            if (issueDTO.clientId && assignee.id && issueDTO.payload.issue.id) {
                if (issueDTO.isResolved()) {
                    await AchievementModel.saveAchievement(issueDTO.clientId, assignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
                } else if (issueDTO.isUnresolved()) {
                    await AchievementModel.deleteAchievement(issueDTO.clientId, assignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
                }
            } else {
                throw new InvalidRequestException()
            }
        }
    }

    public async updateIssueAssignee(issueDTO: IssueDTO) {
        if (issueDTO.checkResolved()) {
            const newAssignee = issueDTO.payload.assignee.new
            const oldAssignee = issueDTO.payload.assignee.old

            if (newAssignee) {
                // issue가 unassigned되는 케이스를 방어한다
                if (issueDTO.clientId && newAssignee.id && issueDTO.payload.issue.id) {
                    await AchievementModel.saveAchievement(issueDTO.clientId, newAssignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
                } else {
                    throw new InvalidRequestException()
                }
            }

            if (oldAssignee) {
                // 기존에 issue가 unassigned되어있는 경우를 방어한다
                if (issueDTO.clientId && oldAssignee.id && issueDTO.payload.issue.id) {
                    await AchievementModel.deleteAchievement(
                        issueDTO.clientId,
                        oldAssignee.id,
                        issueDTO.payload.issue.id,
                        AchievementType.ResolveIssue,
                    )
                } else {
                    throw new InvalidRequestException()
                }
            }
        }
    }

    public async deleteIssue(issueDTO: IssueDTO) {
        const assignee = issueDTO.payload.issue.assignee
        if (assignee && issueDTO.checkResolved()) {
            if (issueDTO.clientId && assignee.id && issueDTO.payload.issue.id) {
                await AchievementModel.deleteAchievement(issueDTO.clientId, assignee.id, issueDTO.payload.issue.id, AchievementType.ResolveIssue)
            } else {
                throw new InvalidRequestException()
            }
        }
    }

    public async handleCodeReviewWebHook(codeReviewDTO: CodeReviewDTO, axiosOption: any, isOpen: boolean) {
        if (codeReviewDTO.payload.className != 'CodeReviewWebhookEvent') {
            throw new WrongClassNameException()
        }
        const organization = await OrganizationModel.findByClientId(codeReviewDTO.clientId)
        const reviewInfo = await this.spaceClient.getCodeReviewInfo(
            organization.serverUrl,
            codeReviewDTO.payload.projectKey.key,
            codeReviewDTO.payload.reviewId,
            axiosOption.headers,
        )
        const createdBy = reviewInfo.createdBy
        if (createdBy) {
            // 특정 사용자가 생성한 MR이 아니면 점수는 누구에게도 할당되지 않도록한다.
            if (isOpen) {
                await Achievement.saveAchievement(codeReviewDTO.clientId, createdBy.id, null, AchievementType.CreateCodeReview)
            } else if (codeReviewDTO.payload.isMergeRequest && reviewInfo.branchPairs[0].isMerged) {
                // MR이면서 머지가 됐을때만 저장한다
                await Achievement.saveAchievement(codeReviewDTO.clientId, createdBy.id, null, AchievementType.MergeMr)
            }
        }
    }
}
