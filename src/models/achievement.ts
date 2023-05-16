import { getModelForClass, index, prop, ReturnModelType } from '@typegoose/typegoose'
import { Document } from '@models/document'
import { ClientSession } from 'mongoose'

export enum AchievementType {
    CreateIssue = 'create_issue',
    ResolveIssue = 'resolve_issue',
    CreateCodeReview = 'create_code_review',
    MergeMr = 'merge_mr',
    ReceiveStar = 'receive_star',
}

@index({ clientId: 1, achievedAt: -1 })
@index({ clientId: 1, starGiver: 1, achievedAt: -1, type: 1 })
@index({ clientId: 1, user: 1, achievedAt: -1, type: 1 })
export class Achievement extends Document {
    @prop()
    public clientId: string

    @prop()
    public user: string

    @prop()
    public issueId?: string

    @prop()
    public projectId?: string

    @prop()
    public reviewId?: string

    @prop()
    public repository?: string

    @prop()
    public starGiver?: string

    @prop()
    public messageId?: string

    @prop({ enum: AchievementType, type: String })
    public type: AchievementType

    @prop()
    public achievedAt: Date

    public static async saveAchievement(achievement): Promise<any> {
        return new AchievementModel({
            ...achievement,
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

    public static async insertStar(clientId: string, starReceiver: string, starGiver: string, messageId: string): Promise<any> {
        if (
            // 중복을 거른다
            await AchievementModel.findOne({
                clientId,
                starGiver,
                messageId,
            })
        ) {
            return
        }
        await new AchievementModel({
            clientId: clientId,
            user: starReceiver,
            starGiver: starGiver,
            messageId: messageId,
            type: AchievementType.ReceiveStar,
            achievedAt: new Date(),
        }).save()
    }

    public static deleteStar(clientId: string, starGiver: string, messageId: string) {
        return AchievementModel.deleteOne({
            clientId,
            starGiver,
            messageId,
            type: AchievementType.ReceiveStar,
        })
    }

    public static getStarCountByUserId(clientId: string, fromDate: Date, toDate: Date, userId: string) {
        return AchievementModel.count({
            clientId: clientId,
            user: userId,
            type: AchievementType.ReceiveStar,
            achievedAt: { $gte: fromDate, $lte: toDate },
        })
    }

    public static async getRemainStarCountByUserId(clientId: string, fromDate: Date, toDate: Date, userId: string): Promise<number> {
        return (
            5 -
            (await AchievementModel.count({
                clientId: clientId,
                starGiver: userId,
                achievedAt: { $gte: fromDate, $lte: toDate },
                type: AchievementType.ReceiveStar,
            }))
        )
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
