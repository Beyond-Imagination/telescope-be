import { AdminDTO, AdminListQueryDTO, AdminRegisterDTO, LoginDTO, VersionUpdateDTO } from '@dtos/admin.dtos'
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
import { OrganizationModel } from '@models/organization'
import { SpaceClient } from '@/client/space.client'

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


    private async getWebhookAndSubscriptionInfo(updateDTO: VersionUpdateDTO) {
        const appToken = await this.getCredentials(updateDTO.serverUrl)
        const info = await OrganizationModel.findByServerUrl(updateDTO.serverUrl)
        return await this.client.getAllWebhooksAndSubscriptions(updateDTO.serverUrl, info.clientId, appToken)
    }

    async update(updateDTO: VersionUpdateDTO) {
        // info의 내용을 순회하며 업데이트 과정을 수행해야합니다.
        // requestedAuthentication이 업데이트 될 경우, 추가적으로 권한을 요청하는 logic이 필요합니다.
        // 버전에 따라 관리되는 subscription과 webhook info를 외부 파일로 구성하면 좋을 것 같습니다.
        // ex) client.updateWebhooks(...).then(데이터베이스에 버전 정보 기입).catch(에러 처리)
        return await this.getWebhookAndSubscriptionInfo(updateDTO)
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
