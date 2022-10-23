import { getModelForClass, prop, index } from '@typegoose/typegoose'
import { Document } from './document'
import { AchievementType } from '@models/achievement'

@index({ clientId: 1 })
export class Point extends Document {
    @prop()
    public clientId: string

    @prop({ enum: AchievementType, type: String })
    public type: AchievementType

    @prop()
    public point: number
}

export const PointModel = getModelForClass(Point)
