import { Body, Controller, Get, OnUndefined, Post, Req, UseBefore } from 'routing-controllers'
import { IndexService } from '@services/index.service'
import { spacePayloadLogging } from '@middlewares/log.middleware'
import { spacePayloadValidation } from '@middlewares/validation.middleware'

@Controller('/space')
@UseBefore(spacePayloadLogging)
@UseBefore(spacePayloadValidation)
export class SpaceController {
    service = new IndexService()

    @Post('/install')
    @OnUndefined(204)
    async handleSpaceInstallPayload(@Body() dto, @Req() request) {
        await this.service.install(dto, request.axiosOption)
    }

    @Post('/uninstall')
    @OnUndefined(204)
    async handleSpaceUnInstallPayload(@Body() dto, @Req() request) {
        await this.service.uninstall(dto)
    }

    @Post('/changeURL')
    @OnUndefined(204)
    async handleSpaceChangeServerUrlPayload(@Body() dto, @Req() request) {
        await this.service.changeServerUrl(dto)
    }

    @Get('/list-command')
    @OnUndefined(204)
    async handleSpaceListCommandPayload(@Body() dto, @Req() request) {
        return this.service.listCommand()
    }

    @Post('/message')
    @OnUndefined(204)
    async handleSpaceMessagePayload(@Body() dto, @Req() request) {
        await this.service.message(dto, request.axiosOption)
    }
}
