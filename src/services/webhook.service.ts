import { Achievement, AchievementModel, AchievementType } from '@models/achievement'
import { getAxiosOption } from '@utils/verifyUtil'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import axios from 'axios'
import { OrganizationModel } from '@models/organization'
import { CodeReviewDTO, UpdateIssueStatusDTO, UpdateIssueAssigneeDTO, CreateIssueDTO, DeleteIssueDTO } from '@dtos/webhooks.dtos'

export class WebhookService {
    public async createIssue(createIssueDTO: CreateIssueDTO) {
        await AchievementModel.saveAchievement(
            createIssueDTO.clientId,
            createIssueDTO.payload.meta.principal.details.user.id,
            AchievementType.CreateIssue,
        )
    }

    public async updateIssueStatus(updateIssueStatusDTO: UpdateIssueStatusDTO) {
        if (updateIssueStatusDTO.isResolved()) {
            await AchievementModel.saveAchievement(
                updateIssueStatusDTO.clientId,
                updateIssueStatusDTO.payload.issue.assignee.id,
                AchievementType.ResolveIssue,
            )
        } else if (updateIssueStatusDTO.isUnresolved()) {
            await AchievementModel.deleteAchievement(
                updateIssueStatusDTO.clientId,
                updateIssueStatusDTO.payload.issue.assignee.id,
                AchievementType.ResolveIssue,
            )
        }
    }

    public async updateIssueAssignee(updateIssueAssigneeDTO: UpdateIssueAssigneeDTO) {
        if (updateIssueAssigneeDTO.checkResolved()) {
            await AchievementModel.saveAchievement(
                updateIssueAssigneeDTO.clientId,
                updateIssueAssigneeDTO.payload.assignee.new.id,
                AchievementType.ResolveIssue,
            )

            await AchievementModel.deleteAchievement(
                updateIssueAssigneeDTO.clientId,
                updateIssueAssigneeDTO.payload.assignee.old.id,
                AchievementType.ResolveIssue,
            )
        }
    }

    public async deleteIssue(deleteIssueDTO: DeleteIssueDTO) {
        if (deleteIssueDTO.checkResolved()) {
            await AchievementModel.deleteAchievement(deleteIssueDTO.clientId, deleteIssueDTO.payload.issue.assignee.id, AchievementType.ResolveIssue)
        }
    }

    public async handleCodeReviewWebHook(codeReviewDTO: CodeReviewDTO, bearerToken: string, isOpen: boolean) {
        if (codeReviewDTO.payload.className != 'CodeReviewWebhookEvent') {
            throw new WrongClassNameException()
        }
        const organization = await OrganizationModel.findByClientId(codeReviewDTO.clientId)
        const url = `${organization.serverUrl}/api/http/projects/key:${codeReviewDTO.payload.projectKey.key}/code-reviews/id:${codeReviewDTO.payload.reviewId}`
        const option = getAxiosOption(bearerToken)
        const reviewInfo = (await axios.get(url, option)).data
        if (isOpen) {
            await Achievement.saveAchievement(codeReviewDTO.clientId, reviewInfo.createdBy.id, AchievementType.CreateCodeReview)
        } else if (reviewInfo.branchPairs[0].isMerged) {
            await Achievement.saveAchievement(codeReviewDTO.clientId, reviewInfo.createdBy.id, AchievementType.MergeMr)
        }
    }
}
