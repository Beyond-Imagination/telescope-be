import { NextFunction, Request, RequestHandler, Response } from 'express'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { getAxiosOption, getBearerToken } from '@utils/verifyUtil'
import { Organization, OrganizationModel } from '@models/organization'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { HttpException } from '@exceptions/HttpException'
import { plainToClass } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { SpaceClient } from '@/client/space.client'

const client = new SpaceClient()

const getAllNestedErrors = (error: ValidationError) => {
    if (error.constraints) {
        return Object.values(error.constraints)
    }
    return error.children.map(getAllNestedErrors).join(',')
}

export const validationMiddleware = (
    type: any,
    value: string | 'body' | 'query' | 'params' = 'body',
    skipMissingProperties = false,
    whitelist = true,
    forbidNonWhitelisted = true,
): RequestHandler => {
    return (req, res, next) => {
        const obj = plainToClass(type, req[value])
        validate(obj, {
            skipMissingProperties,
            whitelist,
            forbidNonWhitelisted,
        }).then((errors: ValidationError[]) => {
            if (errors.length > 0) {
                const message = errors.map(getAllNestedErrors).join(', ')
                next(new HttpException(400, message))
            } else {
                next()
            }
        })
    }
}

export const webhookValidation = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const requestBody = request.body
        const organization = await getOrganization(requestBody)
        const verifyInfo = await getVerifyInfo(organization, request)
        await client.verifyAndGetBearerToken(verifyInfo)
        response.locals.axiosOption = verifyInfo.axiosOption // 컨트롤러에서 Bearer token을 바로 사용할수 있도록 저장 합니다.
        next()
    } catch (error) {
        next(error)
    }
}

async function getOrganization(requestBody: any) {
    let organization
    if (requestBody.className == 'InitPayload') {
        organization = requestBody
        if (!new URL(organization.serverUrl).hostname.endsWith('.jetbrains.space')) {
            // https://*.jetbrains.space 형태의 URL이 아니면 실패
            throw new InvalidRequestException()
        }
    } else {
        organization = await OrganizationModel.findByClientId(requestBody.clientId)
        if (!organization) {
            throw new OrganizationNotFoundException()
        }
    }
    return organization
}

async function getVerifyInfo(organization: Organization, request: Request) {
    const url = organization.serverUrl
    const clientId = organization.clientId
    const bearerToken = await getBearerToken(url, clientId, organization.clientSecret)

    return {
        url: url,
        clientId: clientId,
        signature: request.headers['x-space-public-key-signature'].toString(),
        verifiableData: `${request.headers['x-space-timestamp']}:${JSON.stringify(request.body)}`,
        axiosOption: getAxiosOption(bearerToken),
    }
}
