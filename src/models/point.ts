import { getModelForClass, index, prop } from '@typegoose/typegoose'
import { Document } from './document'
import { AchievementType } from '@models/achievement'
import { ClientSession } from 'mongoose'

@index({ clientId: 1 })
export class Point extends Document {
    @prop()
    public clientId: string

    @prop({ enum: AchievementType, type: String })
    public type: AchievementType

    @prop()
    public point: number

    public static async savePoint(clientId: string, type: AchievementType, session: ClientSession): Promise<Point> {
        return new PointModel({
            clientId: clientId,
            type: type,
            point: 1,
        }).save({ session })
    }

    public static async deleteAllByClientId(clientId: string, session: ClientSession): Promise<any> {
        return PointModel.deleteMany({ clientId: clientId }).session(session)
    }
}

export const PointModel = getModelForClass(Point)
