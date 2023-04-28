import { Body, Controller, Get, OnUndefined, Post, Req, UseAfter, UseBefore } from 'routing-controllers'
import { IndexService } from '@services/index.service'
import { spacePayloadValidation } from '@middlewares/validation.middleware'
import { VERSION } from '@config'
import { spacePayloadLogging } from '@middlewares/log.middleware'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'

@Controller()
export class IndexController {
    service = new IndexService()

    @Get('/')
    index() {
        return { version: VERSION }
    }

    @Post('/')
    @UseBefore(spacePayloadValidation)
    @UseAfter(spacePayloadLogging)
    @OnUndefined(204)
    async handleSpacePayload(@Body() dto, @Req() request) {
        // validator에 의하여 dto는 space payload중 하나로 매핑된다.
        switch (dto.className) {
            case 'InitPayload':
                await this.service.install(dto, request.axiosOption)
                break
            case 'ApplicationUninstalledPayload':
                await this.service.uninstall(dto)
                break
            case 'ChangeServerUrlPayload':
                await this.service.changeServerUrl(dto)
                break
            default:
                throw new WrongClassNameException()
        }
    }
}
