import { AdminDTO, AdminListQueryDTO, AdminRegisterDTO, LoginDTO, OrganizaionDTO, OrganizaionListQueryDTO, VersionUpdateDTO } from '@dtos/admin.dtos'
import { Admin, AdminModel } from '@models/admin'
import { AdminExistException } from '@exceptions/AdminExistException'
import { deleteCache, revokeToken } from '@utils/cache.util'
import { AdminNotFoundException } from '@exceptions/AdminNotFoundException'
import { SECRET_KEY } from '@config'
import { AdminNotApprovedException } from '@exceptions/AdminNotApprovedException'
import { PageInfoDTO } from '@dtos/pagination.dtos'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { AdminApprovedException } from '@exceptions/AdminApprovedException'
import { AdminRejectException } from '@exceptions/AdminRejectException'
import { v4 } from 'uuid'
import { getBearerToken } from '@utils/verify.util'
import { Organization, OrganizationModel } from '@models/organization'
import { SpaceClient } from '@/client/space.client'
import { WebhookAndSubscriptionsInfo } from '@dtos/WebHookInfo'
import { VersionUpdateFailedException } from '@exceptions/VersionUpdateFailedException'
import { logger } from '@utils/logger'
import { Space } from '@/libs/space/space.lib'
import { space } from '@/types/space.type'
import version from '@/libs/space/version'

export class AdminService {
    private client = new SpaceClient()
    async list(query: AdminListQueryDTO) {
        const options = {
            page: query.page,
            limit: query.size,
            sort: query.getSort(),
        }
        const paginated = await AdminModel.paginate({}, options)
        const result = paginated.docs.map(x => new AdminDTO(x as Admin))
        return {
            result: result,
            page: new PageInfoDTO(paginated),
        }
    }

    async organizaionList(query: OrganizaionListQueryDTO) {
        const options = {
            page: query.page,
            limit: query.size,
            sort: query.getSort(),
        }
        const paginated = await OrganizationModel.paginate({}, options)
        const result = paginated.docs.map(x => new OrganizaionDTO(x as Organization))
        return {
            result: result,
            page: new PageInfoDTO(paginated),
        }
    }

    async register(registerDTO: AdminRegisterDTO) {
        try {
            await AdminModel.findByEmail(registerDTO.email)
            throw new AdminExistException()
        } catch (e) {
            if (!(e instanceof AdminNotFoundException)) {
                throw e
            }
        }
        await AdminModel.saveAdmin(registerDTO.email, registerDTO.password, registerDTO.name)
    }

    async login(loginDTO: LoginDTO) {
        const admin = await AdminModel.findByEmail(loginDTO.email)
        if (!bcrypt.compareSync(loginDTO.password, admin.password)) {
            throw new AdminNotFoundException()
        }
        if (!admin.approved) {
            throw new AdminNotApprovedException()
        }
        await AdminModel.updateOne({ _id: admin._id }, { lastLoggedInAt: new Date() })
        return jwt.sign({ id: admin._id, email: admin.email }, SECRET_KEY, {
            expiresIn: '1h',
            jwtid: v4(),
        })
    }

    async approve(id: string) {
        const admin = await AdminModel.findByIdCached(id)
        if (admin.approved) {
            throw new AdminApprovedException()
        }
        await AdminModel.updateOne({ _id: id }, { approved: true, approvedAt: new Date() })
        deleteCache('findAdminById_' + id)
    }

    async reject(admin: AdminDTO, id: string) {
        const targetAdmin = await AdminModel.findByIdCached(id)
        if (targetAdmin._id.toString() === admin.id.toString()) {
            throw new AdminRejectException()
        }
        await AdminModel.updateOne(
            { _id: id },
            {
                approved: false,
                approvedAt: null,
            },
        )
        deleteCache('findAdminById_' + id)
    }

    logout(token: string) {
        revokeToken(token)
    }

    private async getCredentials(serverUrl: string) {
        const info = await OrganizationModel.findByServerUrl(serverUrl)
        return getBearerToken(serverUrl, info.clientId, info.clientSecret)
    }

    private async getWebhookAndSubscriptionInfo(updateDTO: VersionUpdateDTO, accessToken: string, clientId: string) {
        return await this.client.getAllWebhooksAndSubscriptions(updateDTO.serverUrl, clientId, accessToken)
    }

    private async updateWebhooks(
        serverUrl: string,
        clientId: string,
        token: string,
        info: WebhookAndSubscriptionsInfo,
        installInfo: space.installInfo,
    ) {
        try {
            await this.client.updateWebhooks(serverUrl, clientId, info, installInfo, token)
        } catch (error) {
            logger.error(`'updateWebhooks' has been failed`)
            throw new VersionUpdateFailedException(error)
        }
    }

    private async updateSubscriptions(
        serverUrl: string,
        clientId: string,
        token: string,
        info: WebhookAndSubscriptionsInfo,
        installInfo: space.installInfo,
    ) {
        try {
            return await this.client.updateSubscriptions(serverUrl, clientId, token, info, installInfo)
        } catch (error) {
            logger.error(`'updateSubscriptions' has been failed ${JSON.stringify(error)}`)
        }
    }

    private async updateUIExtension(serverUrl: string, token: string, installInfo: space.installInfo) {
        const axiosOption = {
            headers: {
                Authorization: token,
                Accept: 'application/json',
            },
        }

        try {
            await this.client.registerUIExtension(serverUrl, installInfo, axiosOption)
        } catch (error) {
            logger.error(`'updateUIExtension' failed ${JSON.stringify(error)}`)
        }
    }

    public async update(updateDTO: VersionUpdateDTO) {
        const installInfo: space.installInfo = Space.getInstallInfo(updateDTO.targetVersion)
        const clientId = (await OrganizationModel.findByServerUrl(updateDTO.serverUrl)).clientId
        const token = await this.getCredentials(updateDTO.serverUrl)
        const webhookAndSubscriptionsInfo: WebhookAndSubscriptionsInfo = await this.getWebhookAndSubscriptionInfo(updateDTO, token, clientId)
        // 기존에 있는 웹훅만을 업데이트할 경우 subscription update 와 webhook update 사이에는 순서가 없습니다.
        try {
            await Promise.all([
                this.updateWebhooks(updateDTO.serverUrl, clientId, token, webhookAndSubscriptionsInfo, installInfo),
                this.updateSubscriptions(updateDTO.serverUrl, clientId, token, webhookAndSubscriptionsInfo, installInfo),
                this.updateUIExtension(updateDTO.serverUrl, token, installInfo),
            ])
            await OrganizationModel.updateVersionByClientId(clientId, installInfo.version)
        } catch (e) {
            logger.error(JSON.stringify(e))
            throw new VersionUpdateFailedException(e)
        }
    }
}

declare module 'express' {
    interface Request {
        user: any
        axiosOption: any
        jti: string
        _routeWhitelists: any
        _routeBlacklists: any
    }
}
