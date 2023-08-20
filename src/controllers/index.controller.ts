import { Body, Controller, Get, OnUndefined, Post, Req, UseAfter, UseBefore } from 'routing-controllers'
import { IndexService } from '@services/index.service'
import { spacePayloadValidation } from '@middlewares/validation.middleware'
import { VERSION } from '@config'
import { spacePayloadLogging } from '@middlewares/log.middleware'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { space } from '@/types/space.type'

@Controller()
@UseBefore(spacePayloadLogging)
export class IndexController {
    service = new IndexService()

    @Get('/version')
    version() {
        return { version: VERSION }
    }

    @Post('/')
    @UseBefore(spacePayloadValidation)
    @OnUndefined(204)
    async handleSpacePayload(@Body() dto, @Req() request) {
        // validator에 의하여 dto는 space payload중 하나로 매핑된다.
        switch (dto.className) {
            case space.className.INSTALL:
                await this.service.install(dto, request.axiosOption)
                break
            case space.className.UNINSTALL:
                await this.service.uninstall(dto)
                break
            case space.className.CHANGE_URL:
                await this.service.changeServerUrl(dto)
                break
            case space.className.LIST_COMMAND:
                return this.service.listCommand()
            case space.className.MESSAGE:
                await this.service.message(dto, request.axiosOption)
                break
            default:
                throw new WrongClassNameException()
        }
    }
}
