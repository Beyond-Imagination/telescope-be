import { Body, Controller, Get, Post, Req, Res } from 'routing-controllers'
import { InstallDTO } from '@dtos/index.dtos'
import { Request, Response } from 'express'
import { IndexService } from '@services/index.service'

@Controller()
export class IndexController {
    service = new IndexService()

    @Get('/')
    index() {
        return 'OK'
    }

    @Post('/')
    async install(@Req() request: Request, @Body() dto: InstallDTO, @Res() response: Response) {
        await this.service.install(request, dto)
        return response.status(200).end()
    }
}
