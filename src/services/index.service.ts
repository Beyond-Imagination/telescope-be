import { OrganizationModel } from '@models/organization'
import { OrganizationExistException } from '@exceptions/OrganizationExistException'
import axios from 'axios'
import { InstallDTO } from '@dtos/index.dtos'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { getAxiosOption } from '@utils/verifyUtil'
import { WebHookInfo } from '@dtos/WebHookInfo'
import { SERVER_URL, VERSION } from '@utils/constants'
import { Request } from 'express'
import { PointModel } from '@models/point'
import { Transactional } from '@utils/util'
import { AchievementType } from '@models/achievement'

export class IndexService {
    webHookInfos = [
        new WebHookInfo(
            'create_issue',
            '/issue/create',
            'create_issue',
            'Issue',
            'Issue.Created',
            'clientId,webhookId,verificationToken,payload(assignee(new(id)),meta(principal(details(user(id)))),status(new(resolved)),issue(id))',
        ),
        new WebHookInfo(
            'update_issue_status',
            '/issue/update/status',
            'update_issue_status',
            'Issue',
            'Issue.StatusUpdated',
            'clientId,verificationToken,webhookId,payload(issue(id,assignee(id)),status(new(resolved),old(resolved)))',
        ),
        new WebHookInfo(
            'update_issue_assignee',
            '/issue/update/assignee',
            'update_issue_assignee',
            'Issue',
            'Issue.AssigneeUpdated',
            'clientId,verificationToken,webhookId,payload(assignee(old(id),new(id)),issue(id,status(resolved)))',
        ),
        new WebHookInfo(
            'delete_issue',
            '/issue/delete',
            'delete_issue',
            'Issue',
            'Issue.Deleted',
            'clientId,verificationToken,webhookId,payload(issue(id,assignee(id),status(resolved)),deleted(new))',
        ),
        new WebHookInfo('create_code_review', '/code-review/create', 'create_code_review', 'CodeReview', 'CodeReview.Created'),
        new WebHookInfo('close_code_review', '/code-review/close', 'close_code_review', 'CodeReview', 'CodeReview.Closed'),
    ]

    // API 실행에 필요한 권한은 여기에 넣어주시면 application 설치시에 자동으로 신청됩니다.
    rightCodes = ['Project.CodeReview.View']

    @Transactional()
    async install(request: Request, dto: InstallDTO, bearerToken: string) {
        const axiosOptions = getAxiosOption(bearerToken)

        if (dto.className != 'InitPayload') {
            throw new WrongClassNameException()
        }

        if (await OrganizationModel.findByClientId(dto.clientId)) throw new OrganizationExistException()

        await this.requestPermissions(dto.serverUrl, dto.clientId, axiosOptions)

        await Promise.all(this.addWebhooks(dto.serverUrl, dto.clientId, axiosOptions))

        await this.registerUIExtension(dto.serverUrl, axiosOptions)

        // 스페이스 정보를 저장한다.
        await this.insertDBData(dto)
    }

    private requestPermissions(url: string, clientId: string, axiosOptions: any) {
        return axios.patch(
            `${url}/api/http/applications/clientId:${clientId}/authorizations/authorized-rights/request-rights`,
            { contextIdentifier: 'global', rightCodes: this.rightCodes },
            axiosOptions,
        )
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
                payloadFields: webHookInfo.payloadFields,
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

    private async insertDBData(dto: InstallDTO) {
        const promises = []

        const achievementTypes = Object.values(AchievementType)
        achievementTypes.forEach(type => {
            promises.push(
                new PointModel({
                    clientId: dto.clientId,
                    type: type,
                    point: 1,
                }).save(),
            )
        })

        await new OrganizationModel({
            clientId: dto.clientId,
            clientSecret: dto.clientSecret,
            serverUrl: dto.serverUrl,
            admin: [dto.userId],
            version: VERSION,
            point: await Promise.all(promises),
        }).save()
    }
}
