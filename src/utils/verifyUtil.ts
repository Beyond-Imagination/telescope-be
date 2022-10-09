import axios from 'axios'
import { Request } from 'express'
import crypto from 'crypto'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
const jwkToPem = require('jwk-to-pem')

export async function verifyRequest(request: Request, url: string, clientId: string, axiosOptions: any) {
    // 요 함수는 모든 웹훅의 비지니스 로직 전에 실행되어야 합니다.
    if (!new URL(url).hostname.endsWith('.jetbrains.space')) {
        // https://*.jetbrains.space 형태의 URL이 아니면 실패
        throw new InvalidRequestException()
    }
    const signature: string = request.headers['x-space-public-key-signature'].toString()
    const verifiableData = `${request.headers['x-space-timestamp']}:${JSON.stringify(request.body)}`
    const fullUrl = `${url}/api/http/applications/clientId:${clientId}/public-keys`
    const response = JSON.parse((await axios.get(fullUrl, axiosOptions)).data)

    for (const i in response.keys) {
        // 반환된 키중에 하나라도 맞으면 검증 성공한다
        const publicKey = jwkToPem(response.keys[i])
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
            return
        }
    }

    throw new InvalidRequestException()
}

export async function getBearerToken(url: string, clientId: string, client_secret: string) {
    const fullUrl = url + '/oauth/token'
    const token = `Basic ${Buffer.from(clientId + ':' + client_secret).toString('base64')}`
    const FormData = require('form-data')

    const form = new FormData()
    form.append('grant_type', 'client_credentials')
    form.append('scope', '**')

    const response = await axios.post(fullUrl, form, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: token,
        },
    })

    return response.data.access_token
}
