import axios from 'axios'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { WebHookInfo } from '@dtos/WebHookInfo'
import { CLIENT_URL, SERVER_URL } from '@config'
import { Cached } from '@utils/cache.util'

export class SpaceClient {
    async getPublicKeys(verifyInfo: any) {
        const fullUrl = `${verifyInfo.url}/api/http/applications/clientId:${verifyInfo.clientId}/public-keys`
        let publicKeyResponse = (await axios.get(fullUrl, verifyInfo.axiosOption)).data
        if (!(publicKeyResponse instanceof Object)) {
            // Axios mocking 라이브러리에 body를 string으로 못 반환하는 버그가 있어서 불가피 하게 추가된 분기문
            publicKeyResponse = JSON.parse(publicKeyResponse)
        }
        return publicKeyResponse.keys
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

    @Cached({ keyParams: ['$[1]'], prefix: 'requestProfiles' })
    requestProfiles(token: string, serverUrl: string) {
        const requestUrl = `${serverUrl}/api/http/team-directory/profiles`
        return axios
            .get(requestUrl, {
                headers: {
                    Authorization: `${token}`,
                    Accept: `application/json`,
                },
                params: {
                    $fields: 'data(profilePicture,id,name),totalCount',
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
