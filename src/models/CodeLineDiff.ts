import { getModelForClass, index, prop, ReturnModelType } from '@typegoose/typegoose'
import { Document } from '@models/document'
import { CodeLinesSummary } from '@dtos/codeLines.dtos'

@index({ clientId: 1, user: 1, mergedAt: -1 })
export class CodeLineDiff extends Document {
    @prop()
    public clientId: string

    @prop()
    public user: string

    @prop()
    public projectId: string

    @prop()
    public reviewId: string

    @prop()
    public repository: string

    @prop()
    public mergedAt: Date

    @prop()
    public added: number

    @prop()
    public deleted: number

    public static async saveCodeLineDiff(codeLineDiff): Promise<any> {
        return new CodeLineDiffModel({
            ...codeLineDiff,
            mergedAt: new Date(),
        }).save()
    }

    public static async getRankingsByClientId(
        this: ReturnModelType<typeof CodeLineDiff>,
        clientId: string,
        fromDate: Date,
        toDate: Date,
    ): Promise<CodeLinesSummary[]> {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, '$user')
        return this.aggregate(pipeline, { hint: { clientId: 1, mergedAt: -1 } })
    }

    public static async getUserCodeLinesByClientId(
        this: ReturnModelType<typeof CodeLineDiff>,
        clientId: string,
        fromDate: Date,
        toDate: Date,
        targetUser: string,
    ): Promise<CodeLinesSummary[]> {
        const pipeline = this.getAggregationPipeline(clientId, fromDate, toDate, '$user')
        pipeline[0]['$match']['user'] = targetUser
        pipeline.push({ $unset: '_id' })
        return this.aggregate(pipeline)
    }

    private static getAggregationPipeline(clientId: string, fromDate: Date, toDate: Date, groupKey: any): any[] {
        return [
            {
                $match: {
                    // where 조건. clientId 가 같으면서 원하는 범위의 날짜만
                    clientId: clientId,
                    mergedAt: { $gte: fromDate, $lte: toDate },
                },
            },
            {
                $group: {
                    _id: groupKey,
                    addedLines: { $sum: '$added' },
                    deletedLines: { $sum: '$deleted' },
                },
            },
        ]
    }
}

export const CodeLineDiffModel = getModelForClass(CodeLineDiff)
