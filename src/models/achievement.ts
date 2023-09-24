import { getModelForClass, index, prop, ReturnModelType } from '@typegoose/typegoose'
import { Document } from '@models/document'
import { ClientSession } from 'mongoose'
import { Cached } from '@utils/cache.util'

export enum AchievementType {
    CreateIssue = 'create_issue',
    ResolveIssue = 'resolve_issue',
    CreateCodeReview = 'create_code_review',
    MergeMr = 'merge_mr',
    ReceiveStar = 'receive_star',
    CodeReviewDiscussion = 'code_review_discussion',
    AcceptCodeReview = 'accept_code_review',
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

    @prop()
    public discussionId?: string

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

    public static async getOrganizationScoreListByClientId(
        this: ReturnModelType<typeof Achievement>,
        clientId: string,
        fromDate: Date,
        toDate: Date,
    ) {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, {
            clientId: '$clientId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$achievedAt' } },
        })
        pipeline.push({
            $sort: {
                '_id.date': 1,
            },
        })
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

    public static async deleteCodeReviewDiscussionAchievement(clientId: string, discussionId: string, reviewId: string): Promise<any> {
        return AchievementModel.deleteOne({
            clientId,
            discussionId,
            reviewId,
            type: AchievementType.CodeReviewDiscussion,
        })
    }

    static async deleteReviewerAcceptedChangesAchievement(clientId: string, reviewId: string, user: string) {
        return AchievementModel.deleteOne({
            clientId,
            reviewId,
            user,
            type: AchievementType.AcceptCodeReview,
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

    public static async getUserScoreByClientIdGroupByDate(
        this: ReturnModelType<typeof Achievement>,
        clientId: string,
        fromDate: Date,
        toDate: Date,
        targetUser: string,
    ) {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$achievedAt' } },
        })
        pipeline[0]['$match']['user'] = targetUser
        pipeline.push({
            $sort: {
                '_id.date': 1,
            },
        })
        return this.aggregate(pipeline)
    }

    // 요 정보는 한번 계산이 되면 좀처럼 바뀌기 힘든 값이므로 캐시를 사용한다.
    @Cached({ keyParams: ['$..*'], prefix: 'starryPeople', ttl: 1000 * 60 * 24 * 7 })
    public static async getMostStarPeopleByClientId(this: ReturnModelType<typeof Achievement>, clientId: string, fromDate: Date, toDate: Date) {
        const pipeline = this.getMostStarPeopleAggregationPipeline(clientId, fromDate, toDate)
        return this.aggregate(pipeline)
    }

    private static getAggregationPipeline(clientId: string, fromDate: Date, toDate: Date, groupKey: any): any[] {
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
                    receiveStar: { $sum: { $cond: [{ $eq: ['$type', AchievementType.ReceiveStar] }, 1, 0] } },
                    codeReviewDiscussion: { $sum: { $cond: [{ $eq: ['$type', AchievementType.CodeReviewDiscussion] }, 1, 0] } },
                    acceptCodeReview: { $sum: { $cond: [{ $eq: ['$type', AchievementType.AcceptCodeReview] }, 1, 0] } },
                },
            },
        ]
    }

    private static getMostStarPeopleAggregationPipeline(clientId: string, fromDate: Date, toDate: Date): any[] {
        return [
            {
                $match: {
                    // where 조건. clientId 가 같으면서 원하는 범위의 날짜만
                    clientId: clientId,
                    achievedAt: { $gte: fromDate, $lte: toDate },
                },
            },
            {
                // 각 (월 & user)기준 별 받은 횟수 계산
                $group: {
                    _id: {
                        user: '$user',
                        year: { $year: '$achievedAt' },
                        month: { $month: '$achievedAt' },
                    },
                    count: { $sum: { $cond: [{ $eq: ['$type', AchievementType.ReceiveStar] }, 1, 0] } },
                },
            },
            {
                // 각 (월 & user)기준으로는 오름차순 별 받은 횟수기준으로 내림차순 정렬
                $sort: { '_id.year': 1, '_id.month': 1, count: -1 },
            },
            {
                $group: {
                    // 각 월별로 별을 가장 많이 받은 유저 id와 점수를 가져온다.
                    _id: { year: '$_id.year', month: '$_id.month' },
                    userId: { $first: '$_id.user' },
                    score: { $first: '$count' },
                },
            },
        ]
    }
}

export const AchievementModel = getModelForClass(Achievement)
