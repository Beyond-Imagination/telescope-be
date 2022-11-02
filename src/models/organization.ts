import { ClientSession } from 'mongoose'
import { getModelForClass, index, prop, ReturnModelType } from '@typegoose/typegoose'

import { Document } from './document'
import { VERSION } from '@config'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'

export class Point {
    @prop({ default: 1 })
    public createIssue: number

    @prop({ default: 1 })
    public resolveIssue: number

    @prop({ default: 1 })
    public createCodeReview: number

    @prop({ default: 1 })
    public mergeMr: number
}

@index({ clientId: 1 })
@index({ serverUrl: 1 })
export class Organization extends Document {
    @prop()
    public clientId: string

    @prop()
    public clientSecret: string

    @prop()
    public serverUrl: string

    @prop({ _id: false })
    public points: Point

    @prop({ type: String })
    public admin: string[]

    @prop()
    public version: string

    public static async findByServerUrl(this: ReturnModelType<typeof Organization>, serverUrl: string): Promise<Organization> {
        const organization = await this.findOne({ serverUrl }).exec()
        if (organization) {
            return organization
        } else {
            throw new OrganizationNotFoundException()
        }
    }

    public static async findByClientId(this: ReturnModelType<typeof Organization>, clientId: string): Promise<Organization> {
        const organization = await this.findOne({ clientId }).exec()
        if (organization) {
            return organization
        } else {
            throw new OrganizationNotFoundException()
        }
    }

    public static async deleteAllByClientId(clientId: string, session: ClientSession): Promise<any> {
        return OrganizationModel.deleteMany({ clientId: clientId }).session(session)
    }

    public static async saveOrganization(
        clientId: string,
        clientSecret: string,
        serverUrl: string,
        admin: string,
        session: ClientSession,
    ): Promise<Organization> {
        return new OrganizationModel({
            clientId: clientId,
            clientSecret: clientSecret,
            serverUrl: serverUrl,
            admin: [admin],
            points: new Point(),
            version: VERSION,
        }).save({ session })
    }
}

export const OrganizationModel = getModelForClass(Organization)
