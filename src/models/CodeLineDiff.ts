import { getModelForClass, index, prop } from '@typegoose/typegoose'
import { Document } from '@models/document'

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
}

export const CodeLineDiffModel = getModelForClass(CodeLineDiff)
