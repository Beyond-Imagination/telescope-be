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
}
