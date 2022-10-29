import { Body, Controller, Get, Post, Req, Res, UseBefore } from 'routing-controllers'
import { InstallDTO } from '@dtos/index.dtos'
import { Request, Response } from 'express'
import { IndexService } from '@services/index.service'
import { webhookValidation } from '@middlewares/validation.middleware'

@Controller()
export class IndexController {
    service = new IndexService()

    @Get('/')
    index() {
        return 'OK'
    }

    @Post('/')
    @UseBefore(webhookValidation)
    async install(@Req() request: Request, @Body() dto: InstallDTO, @Res() response: Response) {
        await this.service.install(request, dto, response.locals.axiosOption)
        return response.status(200).end()
    }
}
