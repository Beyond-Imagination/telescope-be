import { NextFunction, Request, Response } from 'express'
import { logger } from '@utils/logger'
import { LogDto } from '@dtos/index.dtos'

export const adminLog = (request: Request, response: Response, next: NextFunction) => {
    request._routeWhitelists.req = ['user']
    request._routeBlacklists.body = ['password']
    next()
}

export const spacePayloadLogging = (request: Request, response: Response, next: NextFunction) => {
    const logType = request.body.className
    const clientId = request.body.clientId

    logger.info(JSON.stringify(new LogDto(logType, clientId)))
    next()
}
