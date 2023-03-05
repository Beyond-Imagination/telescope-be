import { Authorized, Body, BodyParam, Controller, Get, OnUndefined, Post, QueryParams, UseBefore } from 'routing-controllers'
import { AdminService } from '@services/admin.service'
import { AdminListQueryDTO, AdminRegisterDTO, LoginDTO } from '@dtos/admin.dtos'
import { adminLog } from '@middlewares/log.middleware'

@UseBefore(adminLog)
@Controller('/admin')
export class AdminController {
    service = new AdminService()

    @Authorized()
    @Get('/')
    async list(@QueryParams() query: AdminListQueryDTO) {
        return await this.service.list(query)
    }

    @Post('/register')
    @OnUndefined(204)
    async register(@Body() dto: AdminRegisterDTO) {
        await this.service.register(dto)
    }

    @Post('/login')
    async login(@Body() dto: LoginDTO) {
        return { token: await this.service.login(dto) }
    }

    @Authorized()
    @Post('/approve')
    @OnUndefined(204)
    async approve(@BodyParam('id') id: string) {
        await this.service.approve(id)
    }
}
