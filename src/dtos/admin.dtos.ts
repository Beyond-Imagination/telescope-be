import { IsEmail, IsNotEmpty } from 'class-validator'
import { Admin } from '@models/admin'
import { Organization } from '@models/organization'

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

export class OrganizationListQueryDTO {
    page = 1
    size = 15
    sort: AdminSortType = AdminSortType.Newest

    getSort() {
        switch (this.sort) {
            case AdminSortType.Newest:
                return {
                    createdAt: 'desc',
                }

            default:
                return undefined
        }
    }
}

export class OrganizaionDTO {
    id: string
    clientId: string
    clientSecret: string
    serverUrl: string
    points = {
        createIssue: 0,
        resolveIssue: 0,
        createCodeReview: 0,
        mergeMr: 0,
        receiveStar: 0,
    }
    admin: string[]
    version: string
    createdAt: Date

    constructor(organizaion: Organization) {
        this.id = organizaion._id.toString()
        this.clientId = organizaion.clientId
        this.serverUrl = organizaion.serverUrl
        this.points.createCodeReview = organizaion.points.createCodeReview
        this.points.createIssue = organizaion.points.createIssue
        this.points.mergeMr = organizaion.points.mergeMr
        this.points.resolveIssue = organizaion.points.resolveIssue
        this.points.receiveStar = organizaion.points.receiveStar
        this.admin = organizaion.admin
        this.version = organizaion.version
        this.createdAt = organizaion.createdAt
    }
}

export class VersionUpdateDTO {
    serverUrl: string
    targetVersion: string
}

export class OrganizationWebhookQueryDto {
    @IsNotEmpty()
    serverUrl: string
}
