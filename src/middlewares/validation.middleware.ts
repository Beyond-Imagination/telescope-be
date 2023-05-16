import { NextFunction, Request, RequestHandler, Response } from 'express'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { getAxiosOption, getBearerToken } from '@utils/verify.util'
import { Organization, OrganizationModel } from '@models/organization'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { HttpException } from '@exceptions/HttpException'
import { plainToClass } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { SpaceClient } from '@/client/space.client'
import crypto from 'crypto'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import jwkToPem from 'jwk-to-pem'
import { deleteCache } from '@utils/cache.util'
import { WrongServerUrlException } from '@exceptions/WrongServerUrlException'
import { payload } from '@/types/space.type'

const client = SpaceClient.getInstance()

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
        if (requestBody.className === 'AppPublicationCheckPayload') {
            response.status(200).end()
            return
        } else if (!requestBody.className) {
            throw new WrongClassNameException()
        }
        const organization = await getOrganization(requestBody)
        const verifyInfo = await getVerifyInfo(organization, request)
        try {
            await verifyRequest(verifyInfo)
        } catch (e) {
            if (e instanceof InvalidRequestException) {
                // 만약 캐시에 있는 public key가 만료되었을 경우를 고려해 캐시를 지우고 재시도 한다.
                deleteCache(`getPublicKeys_${verifyInfo.clientId}`)
                await verifyRequest(verifyInfo)
            } else {
                throw e
            }
        }
        request.axiosOption = verifyInfo.axiosOption // 컨트롤러에서 Bearer token을 바로 사용할수 있도록 저장 합니다.
        next()
    } catch (error) {
        next(error)
    }
}

async function verifyRequest(verifyInfo: any) {
    const keys = await client.getPublicKeys(verifyInfo)
    for (const i in keys) {
        // 반환된 키중에 하나라도 맞으면 검증 성공한다
        const publicKey = jwkToPem(keys[i])
        const verified = crypto.verify(
            'SHA512',
            verifyInfo.verifiableData,
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING,
            },
            Buffer.from(verifyInfo.signature, 'base64'),
        )

        if (verified) {
            return
        }
    }
    throw new InvalidRequestException()
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

export const issueWebhookValidation = (request: Request, response: Response, next: NextFunction) => {
    try {
        const requestBody = request.body
        if (requestBody.payload.className === 'IssueWebhookEvent') {
            next()
        } else {
            throw new WrongClassNameException()
        }
    } catch (error) {
        next(error)
    }
}

function checkClassName(className: string, expectValue: string) {
    if (className !== expectValue) throw new WrongClassNameException()
}

function checkServerUrl(serverUrl: string) {
    if (!new URL(serverUrl).hostname.endsWith('.jetbrains.space')) throw new WrongServerUrlException()
}

async function checkOrganizationExist(clientId: string) {
    return OrganizationModel.findByClientId(clientId)
}

export const changeServerUrlValidation = async (request: Request, response: Response, next: NextFunction) => {
    const payload = request.body
    try {
        checkClassName(payload.className, 'ChangeServerUrlPayload')
        checkServerUrl(payload.newServerUrl)
        await checkOrganizationExist(payload.clientId)
        next()
    } catch (error) {
        next(error) // error를 propagate
    }
}

export const spacePayloadValidation = (request: Request, response: Response, next: NextFunction) => {
    let validator
    const payloadType: payload.className = payload.typeFactory.of(request.body.className)
    switch (payloadType) {
        case payload.className.CHANGE_URL:
            validator = changeServerUrlValidation
            break

        case payload.className.ISSUE_WEBHOOK:
            validator = issueWebhookValidation
            break

        case payload.className.APP_PUBLICATION_CHECK:
        case payload.className.INSTALL:
        case payload.className.UNINSTALL:
            validator = webhookValidation
            break

        default:
            throw new WrongClassNameException()
    }
    validator(request, response, next)
}
