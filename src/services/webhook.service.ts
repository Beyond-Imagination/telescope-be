import { Achievement, AchievementModel, AchievementType } from '@models/achievement'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { OrganizationModel } from '@models/organization'
import { CodeReviewDTO, CreateIssueDTO, DeleteIssueDTO, UpdateIssueAssigneeDTO, UpdateIssueStatusDTO } from '@dtos/webhooks.dtos'
import { SpaceClient } from '@/client/space.client'

export class WebhookService {
    spaceClient = new SpaceClient()

    public async createIssue(createIssueDTO: CreateIssueDTO) {
        await AchievementModel.saveAchievement(
            createIssueDTO.clientId,
            createIssueDTO.payload.meta.principal.details.user.id,
            createIssueDTO.payload.issue.id,
            AchievementType.CreateIssue,
        )
    }

    public async updateIssueStatus(updateIssueStatusDTO: UpdateIssueStatusDTO) {
        const assignee = updateIssueStatusDTO.payload.issue.assignee
        if (assignee) {
            if (updateIssueStatusDTO.isResolved()) {
                await AchievementModel.saveAchievement(
                    updateIssueStatusDTO.clientId,
                    assignee.id,
                    updateIssueStatusDTO.payload.issue.id,
                    AchievementType.ResolveIssue,
                )
            } else if (updateIssueStatusDTO.isUnresolved()) {
                await AchievementModel.deleteAchievement(
                    updateIssueStatusDTO.clientId,
                    assignee.id,
                    updateIssueStatusDTO.payload.issue.id,
                    AchievementType.ResolveIssue,
                )
            }
        }
    }

    public async updateIssueAssignee(updateIssueAssigneeDTO: UpdateIssueAssigneeDTO) {
        if (updateIssueAssigneeDTO.checkResolved()) {
            const newAssignee = updateIssueAssigneeDTO.payload.assignee.new
            const oldAssignee = updateIssueAssigneeDTO.payload.assignee.old
            if (newAssignee) {
                // issue가 unassigned되는 케이스를 방어한다
                await AchievementModel.saveAchievement(
                    updateIssueAssigneeDTO.clientId,
                    newAssignee.id,
                    updateIssueAssigneeDTO.payload.issue.id,
                    AchievementType.ResolveIssue,
                )
            }
            if (oldAssignee) {
                // 기존에 issue가 unassigned되어있는 경우를 방어한다
                await AchievementModel.deleteAchievement(
                    updateIssueAssigneeDTO.clientId,
                    oldAssignee.id,
                    updateIssueAssigneeDTO.payload.issue.id,
                    AchievementType.ResolveIssue,
                )
            }
        }
    }

    public async deleteIssue(deleteIssueDTO: DeleteIssueDTO) {
        const assignee = deleteIssueDTO.payload.issue.assignee
        if (assignee && deleteIssueDTO.checkResolved()) {
            await AchievementModel.deleteAchievement(
                deleteIssueDTO.clientId,
                assignee.id,
                deleteIssueDTO.payload.issue.id,
                AchievementType.ResolveIssue,
            )
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

        if (isOpen) {
            await Achievement.saveAchievement(codeReviewDTO.clientId, reviewInfo.createdBy.id, null, AchievementType.CreateCodeReview)
        } else if (codeReviewDTO.payload.isMergeRequest && reviewInfo.branchPairs[0].isMerged) {
            // MR이면서 머지가 됐을때만 저장한다
            await Achievement.saveAchievement(codeReviewDTO.clientId, reviewInfo.createdBy.id, null, AchievementType.MergeMr)
        }
    }
}
