import { NextFunction, Request, Response } from 'express'
import { OrganizationModel } from '@models/organization'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'

export const setOrganizationByServerUrl = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const serverUrl = request.body.serverUrl || request.query.serverUrl
        if (!serverUrl) {
            throw new OrganizationNotFoundException()
        }
        request.organization = await OrganizationModel.findByServerUrl(serverUrl)
        next()
    } catch (e) {
        next(e)
    }
}
