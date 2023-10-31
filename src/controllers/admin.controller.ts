import {
    Authorized,
    Body,
    BodyParam,
    Controller,
    Delete,
    Get,
    OnUndefined,
    Patch,
    Post,
    QueryParams,
    Req,
    UseBefore,
    Param,
} from 'routing-controllers'
import { AdminService } from '@services/admin.service'
import {
    AdminListQueryDTO,
    AdminRegisterDTO,
    LoginDTO,
    OrganizationListQueryDTO,
    OrganizationWebhookQueryDto,
    VersionUpdateDTO,
    MessageQueryDTO,
} from '@dtos/admin.dtos'
import { adminLog } from '@middlewares/log.middleware'
import { Request } from 'express'
import { setOrganizationByServerUrl } from '@middlewares/organization.middleware'
import { checkMessageId } from '@middlewares/validation.middleware'

@UseBefore(adminLog)
@Controller('/admin')
export class AdminController {
    service = new AdminService()

    @Authorized()
    @Get('/')
    async list(@QueryParams() query: AdminListQueryDTO) {
        return await this.service.list(query)
    }

    @Authorized()
    @Get('/organization')
    async organizationList(@QueryParams() query: OrganizationListQueryDTO) {
        return await this.service.organizationList(query)
    }

    @Authorized()
    @Get('/organization/webhooks')
    async organizationWebhooks(@QueryParams() params: OrganizationWebhookQueryDto) {
        return await this.service.organizationWebhooks(params)
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

    @Authorized()
    @Post('/reject')
    @OnUndefined(204)
    async reject(@Req() req: Request, @BodyParam('id') id: string) {
        await this.service.reject(req.user, id)
    }

    @Authorized()
    @Post('/logout')
    @OnUndefined(204)
    logout(@Req() req: Request) {
        this.service.logout(req.jti)
    }

    @Authorized()
    @Patch('/organization/version')
    @OnUndefined(204)
    async version(@Body() dto: VersionUpdateDTO) {
        await this.service.update(dto)
    }

    @Authorized()
    @Delete('/organization')
    @UseBefore(setOrganizationByServerUrl)
    @OnUndefined(204)
    async delete(@Req() req: Request) {
        await this.service.deleteOrganization(req.organization)
    }

    @Authorized()
    @Get('/messages')
    async messageList() {
        return await this.service.messageList()
    }

    @Authorized()
    @Post('/messages/:id/send')
    @UseBefore(checkMessageId)
    @OnUndefined(204)
    async sendMessage(@Param('id') id: string, @Body() dto: MessageQueryDTO) {
        return await this.service.broadcastMessage(id, dto.serverUrls)
    }
}
