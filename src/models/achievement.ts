import { DocumentType, getModelForClass, prop, ReturnModelType } from '@typegoose/typegoose'
import { Document } from '@models/document'

export enum AchievementType {
    CreateIssue = 'create_issue',
    ResolveIssue = 'resolve_issue',
    CreateCodeReview = 'create_code_review',
    MergeMr = 'merge_mr',
}

export class Achievement extends Document {
    @prop()
    public clientId: string

    @prop()
    public user: string

    @prop({ enum: AchievementType, type: String })
    public type: AchievementType

    @prop()
    public performedAt: Date

    public static async saveAchievement(clientId: string, user: string, type: AchievementType): Promise<any> {
        return new AchievementModel({
            clientId,
            user,
            type,
            performedAt: new Date(),
        }).save()
    }

    public static async deleteAchievement(clientId: string, user: string, type: AchievementType): Promise<any> {
        return AchievementModel.deleteOne({
            clientId,
            user,
            type,
        })
    }

    public static async getTeamScoreByClientId(this: ReturnModelType<typeof Achievement>, clientId: string, fromDate: Date, toDate: Date) {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, '$clientId')
        pipeline.push({ $unset: '_id' })
        return this.aggregate(pipeline)
    }

    public static async getRankingsByClientId(this: ReturnModelType<typeof Achievement>, clientId: string, fromDate: Date, toDate: Date) {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, '$user')
        pipeline.push({ $sort: { total: -1 } })
        return this.aggregate(pipeline)
    }

    // TODO sample data 추가 후 테스트
    private static getAggregationPipeline(clientId: string, fromDate: Date, toDate: Date, groupKey: string): any[] {
        return [
            {
                $match: {
                    // where 조건. clientId 가 같으면서 원하는 범위의 날짜만
                    clientId: clientId,
                    performedAt: { $gte: fromDate, $lte: toDate },
                },
            },
            {
                $lookup: {
                    // points table 과 join. 1:1 match
                    from: 'points',
                    localField: 'type',
                    foreignField: 'type',
                    pipeline: [{ $match: { $expr: { $eq: ['$clientId', clientId] } } }],
                    as: 'score',
                },
            },
            {
                // lookup 결과가 배열 형태로 저장됨. score 객체 배열 제거
                // 기존 : score = [ { $score_info } ]
                // 변경 : score = { $score_info }
                $unwind: '$score',
            },
            {
                // user 의 각 type 별 점수 계산
                $group: {
                    _id: groupKey,
                    total: { $sum: '$score.point' },
                    createIssue: { $sum: { $cond: [{ $eq: ['$type', 'create_issue'] }, '$score.point', 0] } },
                    resolveIssue: { $sum: { $cond: [{ $eq: ['$type', 'resolve_issue'] }, '$score.point', 0] } },
                    createCodeReview: { $sum: { $cond: [{ $eq: ['$type', 'create_code_review'] }, '$score.point', 0] } },
                    mergeMr: { $sum: { $cond: [{ $eq: ['$type', 'merge_mr'] }, '$score.point', 0] } },
                },
            },
        ]
    }
}

export const AchievementModel = getModelForClass(Achievement)
