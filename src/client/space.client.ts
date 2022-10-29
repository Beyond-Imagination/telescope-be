import axios from 'axios'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { WebHookInfo } from '@dtos/WebHookInfo'
import { CLIENT_URL, SERVER_URL } from '@config'
import crypto from 'crypto'

const jwkToPem = require('jwk-to-pem')

export class SpaceClient {
    async verifyAndGetBearerToken(verifyInfo: any) {
        const fullUrl = `${verifyInfo.url}/api/http/applications/clientId:${verifyInfo.clientId}/public-keys`
        const publicKeyResponse = JSON.parse((await axios.get(fullUrl, verifyInfo.axiosOption)).data)

        for (const i in publicKeyResponse.keys) {
            // 반환된 키중에 하나라도 맞으면 검증 성공한다
            const publicKey = jwkToPem(publicKeyResponse.keys[i])
            const verified = crypto.verify(
                'SHA512',
                Buffer.from(verifyInfo.verifiableData),
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

    requestPermissions(url: string, clientId: string, axiosOption: any, rightCodes: string[]) {
        return axios.patch(
            `${url}/api/http/applications/clientId:${clientId}/authorizations/authorized-rights/request-rights`,
            { contextIdentifier: 'global', rightCodes: rightCodes },
            axiosOption,
        )
    }

    registerWebHook(url: string, webHookInfo: WebHookInfo, axiosOption: any) {
        return axios.post(
            url,
            {
                name: webHookInfo.webHookName,
                endpoint: {
                    url: `${SERVER_URL}/webhooks${webHookInfo.url}`,
                    sslVerification: false,
                },
                acceptedHttpResponseCodes: [],
                payloadFields: webHookInfo.payloadFields,
            },
            axiosOption,
        )
    }

    registerSubscription(url: string, webHookInfo: WebHookInfo, webHookId: string, axiosOption: any) {
        return axios.post(
            `${url}/${webHookId}/subscriptions`,
            {
                name: webHookInfo.subscriptionName,
                subscription: {
                    subjectCode: webHookInfo.subjectCode,
                    filters: [],
                    eventTypeCodes: [webHookInfo.eventTypeCode],
                },
            },
            axiosOption,
        )
    }

    registerUIExtension(url: string, axiosOption: any) {
        return axios.patch(
            `${url}/api/http/applications/ui-extensions`,
            {
                contextIdentifier: 'global',
                extensions: [
                    {
                        className: 'ApplicationHomepageUiExtensionIn',
                        iframeUrl: CLIENT_URL,
                    },
                ],
            },
            axiosOption,
        )
    }

    requestProfiles(token: string, serverUrl: string) {
        const requestUrl = `${serverUrl}/api/http/team-directory/profiles`
        return axios
            .get(requestUrl, {
                headers: {
                    Authorization: `${token}`,
                    Accept: `application/json`,
                },
                params: {
                    $fields: 'data(id,name),totalCount',
                },
            })
            .catch(function (error) {
                console.log(error)
                throw new InvalidRequestException()
            })
    }

    async getCodeReviewInfo(serverUrl, projectKey, reviewId, headers: any) {
        const url = `${serverUrl}/api/http/projects/key:${projectKey}/code-reviews/id:${reviewId}`
        const axiosOption = {
            headers: headers,
            params: {
                $fields: 'createdBy(id),branchPairs(isMerged)',
            },
        }
        return (await axios.get(url, axiosOption)).data
    }
}
