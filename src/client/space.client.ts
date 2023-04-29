import axios from 'axios'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { Cached } from '@utils/cache.util'
import { space } from '@/types/space.type'
import { logger } from '@utils/logger'
import { Organization } from '@models/organization'

export class SpaceClient {
    // public key는 일정기간이 지나면 갱신된다고 하는데 갱신 기간을 명시 안해놨고 아마 꽤 길것으로 예상되어 캐싱기간은 1일로 잡아둔다
    @Cached({ keyParams: ['$[0].clientId'], prefix: 'getPublicKeys', ttl: 1000 * 60 * 60 * 24 })
    async getPublicKeys(verifyInfo: any) {
        const fullUrl = `${verifyInfo.url}/api/http/applications/clientId:${verifyInfo.clientId}/public-keys`
        let publicKeyResponse = (await axios.get(fullUrl, verifyInfo.axiosOption)).data
        if (!(publicKeyResponse instanceof Object)) {
            // Axios mocking 라이브러리에 body를 string으로 못 반환하는 버그가 있어서 불가피 하게 추가된 분기문
            publicKeyResponse = JSON.parse(publicKeyResponse)
        }
        return publicKeyResponse.keys
    }

    requestPermissions(url: string, clientId: string, axiosOption: any, installInfo: space.installInfo) {
        return axios.patch(
            `${url}/api/http/applications/clientId:${clientId}/authorizations/authorized-rights/request-rights`,
            { contextIdentifier: 'global', rightCodes: installInfo.right.codes },
            axiosOption,
        )
    }

    registerWebHook(url: string, webHookInfo: space.webhookInfo, axiosOption: any) {
        return axios.post(
            url,
            {
                name: webHookInfo.name,
                endpoint: {
                    url: webHookInfo.url,
                    sslVerification: false,
                },
                acceptedHttpResponseCodes: [],
                payloadFields: webHookInfo.payloadFields,
            },
            axiosOption,
        )
    }

    registerSubscription(url: string, webHookInfo: space.webhookInfo, webHookId: string, axiosOption: any) {
        return axios.post(
            `${url}/${webHookId}/subscriptions`,
            {
                name: webHookInfo.subscription.name,
                subscription: {
                    subjectCode: webHookInfo.subscription.subjectCode,
                    filters: [],
                    eventTypeCodes: [webHookInfo.subscription.eventTypeCode],
                },
            },
            axiosOption,
        )
    }

    registerUIExtension(url: string, installInfo: space.installInfo, axiosOption: any) {
        return axios.patch(
            `${url}/api/http/applications/ui-extensions`,
            {
                contextIdentifier: installInfo.uiExtension.contextIdentifier,
                extensions: installInfo.uiExtension.extension,
            },
            axiosOption,
        )
    }

    @Cached({ keyParams: ['$[1,2]'], prefix: 'profilePicture', ttl: 1000 * 60 * 60 * 24 * 7 })
    async requestProfileImage(token: string, serverUrl: string, profilePicture: string) {
        const requestUrl = `${serverUrl}/d/${profilePicture}`
        return await axios({
            method: 'get',
            url: requestUrl,
            headers: {
                Authorization: `${token}`,
            },
            responseType: 'arraybuffer',
        })
    }

    @Cached({ keyParams: ['$[1]'], prefix: 'requestProfiles' })
    async requestProfiles(token: string, serverUrl: string) {
        const requestUrl = `${serverUrl}/api/http/team-directory/profiles`
        return await axios
            .get(requestUrl, {
                headers: {
                    Authorization: `${token}`,
                    Accept: `application/json`,
                },
                params: {
                    $fields: 'data(profilePicture,id,name),totalCount',
                },
            })
            .catch(function () {
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

    async getAllWebhooksAndSubscriptions(serverUrl: string, clientId: string, token: string) {
        const url = `${serverUrl}/api/http/applications/clientId:${clientId}/webhooks`
        return (
            await axios
                .get(url, {
                    headers: {
                        Authorization: `${token}`,
                        Accept: 'application/json',
                    },
                    params: {
                        $fields: `totalCount,data(webhook(id,name,subscriptions(id,name,subscription(eventTypeCodes,subjectCode),requestedAuthentication(rightCodes))))`,
                    },
                })
                .catch(function (e) {
                    logger.error("[Space API] 'getAllWebhooksAndSubscriptions' has been failed")
                    logger.error(`error: ${e.message}`)
                    throw e
                })
        ).data
    }

    async updateWebhook(organization: Organization, token: string, webhookId: string, info: space.webhookInfo) {
        // PATCH /api/http/applications/{application}/webhooks/{webhookId}
        const url = `${organization.serverUrl}/api/http/applications/clientId:${organization.clientId}/webhooks/${webhookId}`
        return await axios
            .patch(
                url,
                {
                    name: info.name,
                    endpoint: { url: info.url, sslVerification: false },
                    payloadFields: info.payloadFields,
                },
                {
                    headers: {
                        Authorization: token,
                        Accept: 'application/json',
                    },
                },
            )
            .catch(function (e) {
                logger.error(`[Space API] 'updateWebhook' has been failed. error: ${JSON.stringify(e.response.data)}`)
                throw e
            })
    }

    async updateSubscription(
        organization: Organization,
        token: string,
        webhookId: string,
        subscriptionId: string,
        version: string,
        info: space.webhookInfo,
    ) {
        // PATCH /api/http/applications/{application}/webhooks/{webhookId}/subscriptions/{subscriptionId}
        const url = `${organization.serverUrl}/api/http/applications/clientId:${organization.clientId}/webhooks/${webhookId}/subscriptions/${subscriptionId}`
        return axios
            .patch(
                url,
                {
                    name: `${version}_${info.subscription.name}`,
                    subscription: {
                        subjectCode: info.subscription.subjectCode,
                        eventTypeCodes: [info.subscription.eventTypeCode],
                        filters: [],
                    },
                },
                {
                    headers: {
                        Authorization: token,
                        Accept: 'application/json',
                    },
                },
            )
            .catch(function (e) {
                logger.error(`[Space API] 'updateSubscription' has been failed. error: ${JSON.stringify(e.response.data)}`)
                throw e
            })
    }

    async deleteWebhook(organization: Organization, token: string, webhookId: string, subscriptionId: string) {
        //DELETE /api/http/applications/{application}/webhooks/{webhookId}
        const url = `${organization.serverUrl}/api/http/applications/clientId:${organization.clientId}/webhooks/${webhookId}`
        return axios.delete(url, {
            headers: {
                Authorization: token,
                Accept: 'application/json',
            },
        })
    }
}
