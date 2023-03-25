import axios from 'axios'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { Cached } from '@utils/cache.util'
import { space } from '@/types/space.type'
import { UpdateSubscriptionDTO, UpdateWebhookDTO } from '@dtos/webhooks.dtos'
import { logger } from '@utils/logger'

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
            .catch(function (error) {
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
                        $fields: `totalCount,data(webhook(id,name,subscriptions(id,name,subscription(eventTypeCodes,subjectCodes),requestedAuthentication(rightCodes))))`,
                    },
                })
                .catch(function (e) {
                    logger.error("[Space API] 'getAllWebhooksAndSubscriptions' has been failed")
                    logger.error(`error: ${e.response}`)
                })
        ).data
    }
    async updateWebhooks(serverUrl: string, info, version: string | undefined, token: string) {
        // version정보에 맞는 webhook UpdateWebhookDTO를 따로 관리해야합니다.
        // version이 undefined 일 경우에는 최신 버전으로 업데이트 합니다.
        // 관련 feature는 아직 구현하지 않았습니다.
    }
    private async updateWebhook(serverUrl: string, token: string, dto: UpdateWebhookDTO) {
        // PATCH /api/http/applications/{application}/webhooks/{webhookId}
        const url = `${serverUrl}/api/http/applications/${dto.applicationId}/webhooks/${dto.webhookId}`
        return axios
            .patch(
                url,
                {
                    applicationId: dto.applicationId,
                    webhookId: dto.webhookId,
                    name: dto.name,
                    description: dto.description,
                    enabled: dto.enabled,
                    endpoint: dto.endpoint,
                },
                {
                    headers: {
                        Authorization: `${token}`,
                    },
                },
            )
            .catch(function (e) {
                logger.error("[Space API] 'updateWebhook' has been failed")
                logger.error(`error: ${e.response}`)
            })
    }
    private async updateSubscription(serverUrl: string, token: string, dto: UpdateSubscriptionDTO) {
        // PATCH /api/http/applications/{application}/webhooks/{webhookId}/subscriptions/{subscriptionId}
        const url = `${serverUrl}/api/http/applications/${dto.applicationId}/webhooks/${dto.webhookId}/subscriptions/${dto.subscriptionId}`
        return axios
            .patch(
                url,
                {
                    name: dto.name,
                    enabled: true,
                    subscription: {
                        subjectCode: `${dto.subjectCode}`,
                        eventTypeCodes: `${dto.eventTypeCodes}`,
                    },
                },
                {
                    headers: {
                        Authorization: `${token}`,
                    },
                },
            )
            .catch(function (e) {
                logger.error("[Space API] 'updateSubscription' has been failed")
                logger.error(`error: ${e.response}`)
            })
    }
}
