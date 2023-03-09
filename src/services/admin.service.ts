import { AdminDTO, AdminListQueryDTO, AdminRegisterDTO, LoginDTO } from '@dtos/admin.dtos'
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

export class AdminService {
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
            if (e instanceof AdminNotFoundException) {
                // 아래 코드가 없으면 AdminNotFoundException를 던지는 promise가 캐싱되어
                // 이후 findByEmail 호출시 AdminNotFoundException가 throw된다.
                deleteCache(`findAdminByEmail_${registerDTO.email}`)
            } else {
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

    async reject(admin: Admin, id: string) {
        const targetAdmin = await AdminModel.findByIdCached(id)
        if (targetAdmin._id.toString() === admin._id.toString()) {
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
