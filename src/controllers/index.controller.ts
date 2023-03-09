import { Body, Controller, Get, OnUndefined, Post, Req, UseBefore } from 'routing-controllers'
import { InstallAndUninstallDTO } from '@dtos/index.dtos'
import { Request } from 'express'
import { IndexService } from '@services/index.service'
import { webhookValidation } from '@middlewares/validation.middleware'
import { VERSION } from '@config'

@Controller()
export class IndexController {
    service = new IndexService()

    @Get('/')
    index() {
        return { version: VERSION }
    }

    @Post('/')
    @UseBefore(webhookValidation)
    @OnUndefined(204)
    async handelInstallAndUninstall(@Body() dto: InstallAndUninstallDTO, @Req() request: Request) {
        await this.service.handelInstallAndUninstall(dto, request.axiosOption)
    }
}
