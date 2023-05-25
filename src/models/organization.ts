import { ClientSession } from 'mongoose'
import { getModelForClass, index, plugin, prop, ReturnModelType } from '@typegoose/typegoose'

import { Document } from './document'
import { VERSION } from '@config'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import mongoosePaginate from 'mongoose-paginate-v2'
import { Cached } from '@utils/cache.util'
import { PaginateMethod } from './Paginator'
import { space } from '@/types/space.type'

export class Point {
    @prop({ default: 1 })
    public createIssue: number

    @prop({ default: 1 })
    public resolveIssue: number

    @prop({ default: 1 })
    public createCodeReview: number

    @prop({ default: 1 })
    public mergeMr: number

    @prop({ default: 1 })
    public receiveStar: number
}

@plugin(mongoosePaginate)
@index({ clientId: 1 })
@index({ serverUrl: 1 })
export class Organization extends Document {
    static paginate: PaginateMethod<Organization>
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

    @prop()
    public createdAt: Date

    // 서버 정보는 24시간동안 캐싱합니다
    // 요 함수의 경우 keyParams이 조금 예외적인데 this의 경우 파라메터로 들어가는게 아니라서 serverUrl의 인덱스가 0입니다
    @Cached({ keyParams: ['$[0]'], prefix: 'findByServerUrl', ttl: 1000 * 60 * 60 * 24 })
    public static async findByServerUrl(this: ReturnModelType<typeof Organization>, serverUrl: string): Promise<Organization> {
        const organization = await this.findOne({ serverUrl }).exec()
        if (organization) {
            return organization
        } else {
            throw new OrganizationNotFoundException()
        }
    }

    // 서버 정보는 24시간동안 캐싱합니다
    // 요 함수의 경우 keyParams이 조금 예외적인데 this의 경우 파라메터로 들어가는게 아니라서 clientId의 인덱스가 0입니다
    @Cached({ keyParams: ['$[0]'], prefix: 'findByClientId', ttl: 1000 * 60 * 60 * 24 })
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

    public static async updateOrganization(this: ReturnModelType<typeof Organization>, organization: Organization, installInfo: space.installInfo) {
        await OrganizationModel.findOneAndUpdate(
            { clientId: organization.clientId },
            {
                version: installInfo.version,
                // @prop({ default: 1 }) 데코레이터로 DB에 값이 없어도 select 할때 값이 채워져 있다
                // 따라서 해당 정보를 바로 저장하면 자연스럽게 마이그레이션이 된다
                points: organization.points,
            },
        )
    }

    public static async updateServerUrlByClientId(this: ReturnModelType<typeof Organization>, clientId: string, newServerUrl: string) {
        await OrganizationModel.findOneAndUpdate({ clientId: clientId }, { serverUrl: newServerUrl })
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
