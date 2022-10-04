import { getModelForClass, mongoose, prop } from '@typegoose/typegoose'
import { Document } from './document'

class Point extends Document {
    @prop()
    public client_id: string

    @prop()
    public type: string

    @prop()
    public point: number
}

export default getModelForClass(Point)
