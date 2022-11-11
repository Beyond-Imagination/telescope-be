import { getModelForClass, index, prop, ReturnModelType } from '@typegoose/typegoose'
import { Document } from '@models/document'
import { ClientSession } from 'mongoose'

export enum AchievementType {
    CreateIssue = 'create_issue',
    ResolveIssue = 'resolve_issue',
    CreateCodeReview = 'create_code_review',
    MergeMr = 'merge_mr',
}

@index({ clientId: 1, achievedAt: -1 })
export class Achievement extends Document {
    @prop()
    public clientId: string

    @prop()
    public user: string

    @prop()
    public issueId?: string

    @prop({ enum: AchievementType, type: String })
    public type: AchievementType

    @prop()
    public achievedAt: Date

    public static async saveAchievement(clientId: string, user: string, issueId: string, type: AchievementType): Promise<any> {
        return new AchievementModel({
            clientId,
            user,
            issueId,
            type,
            achievedAt: new Date(),
        }).save()
    }

    public static async deleteAchievement(clientId: string, user: string, issueId: string, type: AchievementType): Promise<any> {
        return AchievementModel.deleteOne({
            clientId,
            user,
            issueId,
            type,
        })
    }

    public static async deleteAllByClientId(clientId: string, session: ClientSession): Promise<any> {
        return AchievementModel.deleteMany({ clientId: clientId }).session(session)
    }

    public static async getOrganizationScoreByClientId(this: ReturnModelType<typeof Achievement>, clientId: string, fromDate: Date, toDate: Date) {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, '$clientId')
        pipeline.push({ $unset: '_id' })
        return this.aggregate(pipeline, { hint: { clientId: 1, achievedAt: -1 } })
    }

    public static async getRankingsByClientId(this: ReturnModelType<typeof Achievement>, clientId: string, fromDate: Date, toDate: Date) {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, '$user')
        return this.aggregate(pipeline, { hint: { clientId: 1, achievedAt: -1 } })
    }

    public static async getUserScoreByClientId(
        this: ReturnModelType<typeof Achievement>,
        clientId: string,
        fromDate: Date,
        toDate: Date,
        targetUser: string,
    ) {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, '$user')
        pipeline[0]['$match']['user'] = targetUser
        pipeline.push({ $unset: '_id' })
        return this.aggregate(pipeline)
    }

    private static getAggregationPipeline(clientId: string, fromDate: Date, toDate: Date, groupKey: string): any[] {
        return [
            {
                $match: {
                    // where 조건. clientId 가 같으면서 원하는 범위의 날짜만
                    clientId: clientId,
                    achievedAt: { $gte: fromDate, $lte: toDate },
                },
            },
            {
                // user 의 각 type 별 횟수 계산
                $group: {
                    _id: groupKey,
                    createIssue: { $sum: { $cond: [{ $eq: ['$type', AchievementType.CreateIssue] }, 1, 0] } },
                    resolveIssue: { $sum: { $cond: [{ $eq: ['$type', AchievementType.ResolveIssue] }, 1, 0] } },
                    createCodeReview: { $sum: { $cond: [{ $eq: ['$type', AchievementType.CreateCodeReview] }, 1, 0] } },
                    mergeMr: { $sum: { $cond: [{ $eq: ['$type', AchievementType.MergeMr] }, 1, 0] } },
                },
            },
        ]
    }
}

export const AchievementModel = getModelForClass(Achievement)
