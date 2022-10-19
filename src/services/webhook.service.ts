import { AchievementModel, AchievementType } from '@models/achievement'
import { UpdateIssueStatusDTO } from '@dtos/webhooks.dtos'

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
}
