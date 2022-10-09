import { OrganizationModel } from '@models/organization'
import { OrganizationExistException } from '@exceptions/OrganizationExistException'
import axios from 'axios'
import { Body } from 'routing-controllers'
import { InstallDTO } from '@dtos/index.dtos'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { getBearerToken, verifyRequest } from '@utils/verifyUtil'
import { WebHookInfo } from '@dtos/WebHookInfo'
import { SERVER_URL, VERSION } from '@utils/constants'
import { Request } from 'express'

export class IndexService {
    webHookInfos = [
        new WebHookInfo('create_issue', '/issue/create', 'create_issue', 'Issue', 'Issue.Created'),
        new WebHookInfo('update_issue_status', '/issue/update/status', 'update_issue_status', 'Issue', 'Issue.StatusUpdated'),
        new WebHookInfo('update_issue_assignee', '/issue/update/assignee', 'update_issue_assignee', 'Issue', 'Issue.AssigneeUpdated'),
        new WebHookInfo('delete_issue', '/issue/delete', 'delete_issue', 'Issue', 'Issue.Deleted'),
        new WebHookInfo('create_code_review', '/code-review/create', 'create_code_review', 'CodeReview', 'CodeReview.Created'),
        new WebHookInfo('close_code_review', '/code-review/close', 'close_code_review', 'CodeReview', 'CodeReview.Closed'),
    ]

    async install(request: Request, @Body() dto: InstallDTO) {
        const bearerToken = `Bearer ${await getBearerToken(dto.serverUrl, dto.clientId, dto.clientSecret)}`

        const axiosOptions = {
            headers: {
                'content-type': 'application/json',
                Accept: 'application/json',
                Authorization: bearerToken,
            },
        }

        // 해당 요청이 올바른 요청인지 확인한다
        await verifyRequest(request, dto.serverUrl, dto.clientId, axiosOptions)

        if (dto.className != 'InitPayload') {
            throw new WrongClassNameException()
        }

        if (await OrganizationModel.findByClientId(dto.clientId)) throw new OrganizationExistException()

        await Promise.all(this.addWebhooks(dto.serverUrl, dto.clientId, axiosOptions))

        await this.registerUIExtension(dto.serverUrl, axiosOptions)

        // 스페이스 정보를 저장한다.
        await new OrganizationModel({
            clientId: dto.clientId,
            clientSecret: dto.clientSecret,
            serverUrl: dto.serverUrl,
            admin: [dto.userId],
            version: VERSION,
        }).save()
    }

    private addWebhooks(url: string, clientId: string, axiosOptions: any) {
        const promises = []
        const webHookRegisterUrl = `${url}/api/http/applications/clientId:${clientId}/webhooks`
        this.webHookInfos.forEach(webHookInfo => {
            promises.push(this.addWebhook(webHookRegisterUrl, webHookInfo, axiosOptions))
        })

        return promises
    }

    private async addWebhook(url: string, webHookInfo: WebHookInfo, axiosOptions: any) {
        const response = await this.registerWebHook(url, webHookInfo, axiosOptions)
        const webHookId = response.data.id
        await this.registerSubscription(url, webHookInfo, webHookId, axiosOptions) // 웹훅이 등록이 된 후에 subscription을 등록
    }

    private registerWebHook(url: string, webHookInfo: WebHookInfo, axiosOptions: any) {
        return axios.post(
            url,
            {
                name: webHookInfo.webHookName,
                endpoint: {
                    url: `${SERVER_URL}/webhooks${webHookInfo.url}`,
                    sslVerification: false,
                },
                acceptedHttpResponseCodes: [],
            },
            axiosOptions,
        )
    }

    private registerSubscription(url: string, webHookInfo: WebHookInfo, webHookId: string, axiosOptions: any) {
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
            axiosOptions,
        )
    }

    private registerUIExtension(url: string, axiosOptions: any) {
        return axios.patch(
            `${url}/api/http/applications/ui-extensions`,
            {
                contextIdentifier: 'global',
                extensions: [
                    {
                        className: 'ApplicationHomepageUiExtensionIn',
                        iframeUrl: 'https://someFrontEnd.com',
                    },
                ],
            },
            axiosOptions,
        )
    }
}
