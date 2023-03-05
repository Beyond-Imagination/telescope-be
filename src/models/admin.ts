import { getModelForClass, index, plugin, prop, ReturnModelType } from '@typegoose/typegoose'
import { Cached } from '@utils/cache.util'
import { AdminNotFoundException } from '@exceptions/AdminNotFoundException'
import mongoosePaginate from 'mongoose-paginate-v2'
import { Document } from '@models/document'
import { PaginateMethod } from '@models/Paginator'
import bcrypt from 'bcrypt'

@plugin(mongoosePaginate)
@index({ email: 1 })
@index({ registeredAt: 1 })
export class Admin extends Document {
    static paginate: PaginateMethod<Admin>
    @prop()
    public email: string
    @prop()
    public password: string
    @prop()
    public name: string
    @prop()
    public registeredAt: Date
    @prop()
    public approved: boolean
    @prop()
    public approvedAt?: Date
    @prop()
    public lastLoggedInAt?: Date

    public static async saveAdmin(email: string, password: string, name: string): Promise<any> {
        return new AdminModel({
            email,
            password: bcrypt.hashSync(password, 10),
            name,
            registeredAt: new Date(),
            approved: false,
            approvedAt: null,
            lastLoggedInAt: null,
        }).save()
    }

    @Cached({ keyParams: ['$[0]'], prefix: 'findAdminByEmail', ttl: 1000 * 60 * 60 })
    public static async findByEmail(this: ReturnModelType<typeof Admin>, email: string): Promise<Admin> {
        const admin = await this.findOne({ email: email }).exec()
        if (admin) {
            return admin
        } else {
            throw new AdminNotFoundException()
        }
    }

    @Cached({ keyParams: ['$[0]'], prefix: 'findAdminById', ttl: 1000 * 60 * 60 })
    public static async findByIdCached(this: ReturnModelType<typeof Admin>, id: string): Promise<Admin> {
        const admin = await this.findById(id)
        if (admin) {
            return admin
        } else {
            throw new AdminNotFoundException()
        }
    }
}

export const AdminModel = getModelForClass(Admin)
