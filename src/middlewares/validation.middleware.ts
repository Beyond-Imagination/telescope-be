import { NextFunction, Request, RequestHandler, Response } from 'express'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import axios from 'axios'
import crypto from 'crypto'
import { getAxiosOption, getBearerToken } from '@utils/verifyUtil'
import { OrganizationModel } from '@models/organization'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { HttpException } from '@exceptions/HttpException'
import { plainToClass } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'

const jwkToPem = require('jwk-to-pem')

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
        // 요 로직은 모든 웹훅의 비지니스 로직 전에 실행되어야 합니다.
        let organization: any
        const requestBody = request.body
        if (requestBody.className == 'InitPayload') {
            organization = request.body
            if (!new URL(organization.serverUrl).hostname.endsWith('.jetbrains.space')) {
                // https://*.jetbrains.space 형태의 URL이 아니면 실패
                next(new InvalidRequestException())
            }
        } else {
            organization = await OrganizationModel.findByClientId(requestBody.clientId)
            if (!organization) {
                next(new OrganizationNotFoundException())
            }
        }
        const url = organization.serverUrl
        const clientId = organization.clientId
        const bearerToken = await getBearerToken(url, clientId, organization.clientSecret)

        response.locals.bearerToken = bearerToken // 컨트롤러에서 Bearer token을 바로 사용할수 있도록 저장 합니다.

        const signature: string = request.headers['x-space-public-key-signature'].toString()
        const verifiableData = `${request.headers['x-space-timestamp']}:${JSON.stringify(request.body)}`
        const fullUrl = `${url}/api/http/applications/clientId:${clientId}/public-keys`
        const publicKeyResponse = JSON.parse((await axios.get(fullUrl, getAxiosOption(bearerToken))).data)

        for (const i in publicKeyResponse.keys) {
            // 반환된 키중에 하나라도 맞으면 검증 성공한다
            const publicKey = jwkToPem(publicKeyResponse.keys[i])
            const verified = crypto.verify(
                'SHA512',
                Buffer.from(verifiableData),
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_PADDING,
                },
                Buffer.from(signature, 'base64'),
            )

            if (verified) {
                next()
                return
            }
        }

        next(new InvalidRequestException())
    } catch (error) {
        next(error)
    }
}
