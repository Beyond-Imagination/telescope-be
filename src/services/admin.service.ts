import {
    AdminDTO,
    AdminListQueryDTO,
    AdminRegisterDTO,
    LoginDTO,
    OrganizaionDTO,
    OrganizationListQueryDTO,
    OrganizationWebhookQueryDto,
    VersionUpdateDTO,
} from '@dtos/admin.dtos'
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
import { getAxiosOption, getBearerToken } from '@utils/verify.util'
import { Organization, OrganizationModel, Webhooks } from '@models/organization'
import { SpaceClient } from '@/client/space.client'
import { WebhookAndSubscriptionsInfo } from '@dtos/WebHookInfo'
import { VersionUpdateFailedException } from '@exceptions/VersionUpdateFailedException'
import { logger } from '@utils/logger'
import { Space } from '@/libs/space/space.lib'
import { space } from '@/types/space.type'
import Bottleneck from 'bottleneck'
import { ClientSession } from 'mongoose'
import { Achievement } from '@models/achievement'
import { mongooseTransactionHandler } from '@utils/util'

export class AdminService {
    private client = SpaceClient.getInstance()

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

    async organizationList(query: OrganizationListQueryDTO) {
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

    async organizationWebhooks(params: OrganizationWebhookQueryDto) {
        const serverUrl: string = params.serverUrl
        const { clientId, clientSecret } = await OrganizationModel.findByServerUrl(serverUrl)
        const token = await getBearerToken(serverUrl, clientId, clientSecret)
        const { totalCount, data } = await this.client.getAllWebhooksAndSubscriptions(serverUrl, clientId, token)
        return { totalCount, data }
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

    async deleteOrganization(organization: Organization) {
        await mongooseTransactionHandler(async (session: ClientSession): Promise<void> => {
            await Promise.all([
                Achievement.deleteAllByClientId(organization.clientId, session),
                Organization.deleteAllByClientId(organization.clientId, session),
            ])
        })
    }

    public async update(updateDTO: VersionUpdateDTO) {
        try {
            const installInfo: space.installInfo = Space.getInstallInfo(updateDTO.targetVersion)
            const organization = await OrganizationModel.findByServerUrl(updateDTO.serverUrl)
            const token = await this.getCredentials(organization)
            const webhookAndSubscriptionsInfo: WebhookAndSubscriptionsInfo = await this.getWebhookAndSubscriptionInfo(
                updateDTO,
                token,
                organization.clientId,
            )
            const webhooks = new Webhooks()
            const limiter = new Bottleneck({ maxConcurrent: 5, minTime: 100 })
            // 기존에 있는 웹훅만을 업데이트할 경우 subscription update 와 webhook update 사이에는 순서가 없습니다.
            await limiter.schedule(() => {
                return Promise.all([
                    this.updateUIExtension(organization, token, installInfo),
                    ...this.updateWebhooksAndSubscription(organization, token, webhookAndSubscriptionsInfo, installInfo, webhooks),
                ])
            })
            await OrganizationModel.updateOrganization(organization, installInfo, webhooks)
        } catch (e) {
            logger.error(e.message)
            throw new VersionUpdateFailedException(e)
        }
    }

    private async getCredentials(organization: Organization) {
        return getBearerToken(organization.serverUrl, organization.clientId, organization.clientSecret)
    }

    private async getWebhookAndSubscriptionInfo(updateDTO: VersionUpdateDTO, accessToken: string, clientId: string) {
        return await this.client.getAllWebhooksAndSubscriptions(updateDTO.serverUrl, clientId, accessToken)
    }

    private updateWebhooksAndSubscription(
        organization: Organization,
        token: string,
        current: WebhookAndSubscriptionsInfo,
        target: space.installInfo,
        webhooks: Webhooks,
    ) {
        const keys = new Set<string>()
        Object.keys(target.webhooks).forEach(key => {
            keys.add(key)
        })

        const create = []
        const update = []
        const remove = []

        current.data.forEach(info => {
            if (!info.webhook.id) {
                return
            }
            if (keys.has(info.webhook.name)) {
                update.push({
                    ...target.webhooks[info.webhook.name],
                    webhookId: info.webhook.id,
                    subscriptionId: info.webhook.subscriptions[0].id,
                })
                keys.delete(info.webhook.name)
            } else {
                remove.push({
                    webhookId: info.webhook.id,
                    subscriptionId: info.webhook.subscriptions[0].id,
                })
            }
        })
        keys.forEach(key => {
            create.push(target.webhooks[key])
        })

        const promises = []

        create.forEach(info => {
            promises.push(
                new Promise<void>(async (resolve, reject) => {
                    try {
                        const url = `${organization.serverUrl}/api/http/applications/clientId:${organization.clientId}/webhooks`
                        const option = getAxiosOption(token)
                        const response = await this.client.registerWebHook(url, info, option)
                        const webhookId = response.data.id
                        const subscriptionResponse = await this.client.registerSubscription(url, info, webhookId, option)
                        const subscriptionId = subscriptionResponse.data.id
                        const webhookName = space.webhookNameCamelCase(info.name)
                        webhooks[webhookName] = {
                            webhookId,
                            subscriptionId,
                        }
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                }),
            )
        })

        update.forEach(info => {
            promises.push(
                new Promise<void>(async (resolve, reject) => {
                    try {
                        await this.client.updateWebhook(organization, token, info.webhookId, info)
                        await this.client.updateSubscription(organization, token, info.webhookId, info.subscriptionId, target.version, info)
                        const webhookName = space.webhookNameCamelCase(info.name)
                        webhooks[webhookName] = {
                            webhookId: info.webhookId,
                            subscriptionId: info.subscriptionId,
                        }
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                }),
            )
        })

        remove.forEach(info => {
            promises.push(
                new Promise<void>(async (resolve, reject) => {
                    try {
                        await this.client.deleteWebhook(organization, token, info.webhookId, info.subscriptionId)
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                }),
            )
        })

        return promises
    }

    private async updateUIExtension(organization: Organization, token: string, installInfo: space.installInfo) {
        const axiosOption = {
            headers: {
                Authorization: token,
                Accept: 'application/json',
            },
        }

        try {
            await this.client.registerUIExtension(organization.serverUrl, installInfo, axiosOption)
        } catch (error) {
            logger.error(`'updateUIExtension' failed ${error.message}`)
            throw error
        }
    }
}
