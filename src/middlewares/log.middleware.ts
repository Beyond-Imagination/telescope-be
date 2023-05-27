import { NextFunction, Request, Response } from 'express'
import { logger } from '@utils/logger'
import { space } from '@/types/space.type'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'

export const adminLog = (request: Request, response: Response, next: NextFunction) => {
    request._routeWhitelists.req = ['user']
    request._routeBlacklists.body = ['password']
    next()
}

export const spacePayloadLogging = (request: Request, response: Response, next: NextFunction) => {
    const className = request.body.className

    if (className && !space.knownClassNameSet.has(className)) {
        logger.error('unknown class name', { className })
        next(new WrongClassNameException())
    } else {
        next()
    }
}
