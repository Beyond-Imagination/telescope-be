import { Achievement, AchievementModel, AchievementType } from '@models/achievement'
import { CodeReviewDTO, UpdateIssueStatusDTO } from '@dtos/webhooks.dtos'
import { getAxiosOption } from '@utils/verifyUtil'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import axios from 'axios'
import { OrganizationModel } from '@models/organization'

export class WebhookService {
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
