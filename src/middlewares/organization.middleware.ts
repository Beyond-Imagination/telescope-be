import { NextFunction, Request, Response } from 'express'
import { OrganizationModel } from '@models/organization'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'

export const setOrganizationByServerUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const serverUrl = req.body.serverUrl || req.query.serverUrl
        if (!serverUrl) {
            throw new OrganizationNotFoundException()
        }
        req.organization = await OrganizationModel.findByServerUrl(serverUrl)
        next()
    } catch (e) {
        next(e)
    }
}

export const setOrganizationByClientId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clientId = req.body.clientId
        if (!clientId) {
            throw new OrganizationNotFoundException()
        }
        req.organization = await OrganizationModel.findByClientId(clientId)
        next()
    } catch (e) {
        next(e)
    }
}
