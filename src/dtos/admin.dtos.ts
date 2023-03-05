import { IsEmail, IsNotEmpty } from 'class-validator'
import { Admin } from '@models/admin'

export class AdminRegisterDTO {
    @IsEmail()
    email: string
    @IsNotEmpty()
    password: string
    @IsNotEmpty()
    name: string
}

export class LoginDTO {
    @IsEmail()
    email: string

    @IsNotEmpty()
    password: string
}

export enum AdminSortType {
    Newest = 'newest',
}

export class AdminListQueryDTO {
    page = 1
    size = 10
    sort: AdminSortType = AdminSortType.Newest

    getSort() {
        switch (this.sort) {
            case AdminSortType.Newest:
                return {
                    registeredAt: 'desc',
                }

            default:
                return undefined
        }
    }
}

export class AdminDTO {
    id: string
    email: string
    name: string
    approved: boolean
    registeredAt: Date
    lastLoggedInAt?: Date

    constructor(admin: Admin) {
        this.id = admin._id.toString()
        this.email = admin.email
        this.name = admin.name
        this.approved = admin.approved
        this.registeredAt = admin.registeredAt
        this.lastLoggedInAt = admin.lastLoggedInAt
    }
}
