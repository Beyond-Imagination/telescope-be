import { NextFunction, Request, Response } from 'express'

export const adminLog = (request: Request, response: Response, next: NextFunction) => {
    request._routeWhitelists.req = ['user']
    request._routeBlacklists.body = ['password']
    next()
}
