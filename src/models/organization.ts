import { getModelForClass, index, plugin, prop, Ref, ReturnModelType } from '@typegoose/typegoose'
import autopopulate from 'mongoose-autopopulate'

import { Document } from './document'
import { Point } from '@models/point'
import { VERSION } from '@config'

@index({ clientId: 1 })
@index({ serverUrl: 1 })
@plugin(autopopulate as any)
export class Organization extends Document {
    @prop()
    public clientId: string

    @prop()
    public clientSecret: string

    @prop()
    public serverUrl: string

    @prop({ ref: () => Point, autopopulate: true })
    public point: Ref<Point>[]

    @prop({ type: String })
    public admin: string[]

    @prop()
    public version: string

    public static async findByServerUrl(this: ReturnModelType<typeof Organization>, serverUrl: string) {
        return this.findOne({ serverUrl }).exec()
    }

    public static async findByClientId(this: ReturnModelType<typeof Organization>, clientId: string) {
        return this.findOne({ clientId }).exec()
    }

    public static async saveOrganization(
        clientId: string,
        clientSecret: string,
        serverUrl: string,
        admin: string,
        points: Point[],
    ): Promise<Organization> {
        return new OrganizationModel({
            clientId: clientId,
            clientSecret: clientSecret,
            serverUrl: serverUrl,
            admin: [admin],
            version: VERSION,
            point: points,
        }).save()
    }
}

export const OrganizationModel = getModelForClass(Organization)
