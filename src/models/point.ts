import { getModelForClass, prop } from '@typegoose/typegoose'
import { Document } from './document'

export class Point extends Document {
    @prop()
    public clientId: string

    @prop()
    public type: string

    @prop()
    public point: number
}

export const PointModel = getModelForClass(Point)
