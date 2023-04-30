import { Body, Controller, Get, OnUndefined, Post, Req, UseAfter, UseBefore } from 'routing-controllers'
import { IndexService } from '@services/index.service'
import { spacePayloadValidation } from '@middlewares/validation.middleware'
import { VERSION } from '@config'
import { spacePayloadLogging } from '@middlewares/log.middleware'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { payload } from '@/types/space.type'

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
        const payloadType: payload.className = payload.typeFactory.of(dto.className)
        switch (payloadType) {
            case payload.className.INSTALL:
                await this.service.install(dto, request.axiosOption)
                break
            case payload.className.UNINSTALL:
                await this.service.uninstall(dto)
                break
            case payload.className.CHANGE_URL:
                await this.service.changeServerUrl(dto)
                break
            default:
                throw new WrongClassNameException()
        }
    }
}
