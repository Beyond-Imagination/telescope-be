import { Organization, OrganizationModel } from '@models/organization'
import { OrganizationExistException } from '@exceptions/OrganizationExistException'
import { InstallDTO } from '@dtos/index.dtos'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { WebHookInfo } from '@dtos/WebHookInfo'
import { Request } from 'express'
import { Point } from '@models/point'
import { Transactional } from '@utils/util'
import { AchievementType } from '@models/achievement'
import { SpaceClient } from '@/client/space.client'

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

    spaceClient = new SpaceClient()

    // API 실행에 필요한 권한은 여기에 넣어주시면 application 설치시에 자동으로 신청됩니다.
    rightCodes = ['Project.CodeReview.View', 'Profile.View', 'Project.Issues.View']

    @Transactional()
    async install(request: Request, dto: InstallDTO, axiosOption: any) {
        if (dto.className != 'InitPayload') {
            throw new WrongClassNameException()
        }

        if (await OrganizationModel.findByClientId(dto.clientId)) {
            throw new OrganizationExistException()
        }

        // 스페이스 정보를 저장한다.
        await this.insertDBData(dto)

        await Promise.all([
            // 아래의 API들은 상호 순서가 없고 병렬 처리가 가능하다
            this.spaceClient.requestPermissions(dto.serverUrl, dto.clientId, axiosOption, this.rightCodes),
            this.addWebhooks(dto.serverUrl, dto.clientId, axiosOption),
            this.spaceClient.registerUIExtension(dto.serverUrl, axiosOption),
        ])
    }

    private async insertDBData(dto: InstallDTO) {
        const promises = Object.values(AchievementType).map(type => {
            return Point.savePoint(dto.clientId, type)
        })

        await Organization.saveOrganization(dto.clientId, dto.clientSecret, dto.serverUrl, dto.userId, await Promise.all(promises))
    }

    private addWebhooks(url: string, clientId: string, axiosOption: any) {
        const webHookRegisterUrl = `${url}/api/http/applications/clientId:${clientId}/webhooks`
        return this.webHookInfos.map(webHookInfo => {
            return this.addWebhook(webHookRegisterUrl, webHookInfo, axiosOption)
        })
    }

    private async addWebhook(url: string, webHookInfo: WebHookInfo, axiosOption: any) {
        const response = await this.spaceClient.registerWebHook(url, webHookInfo, axiosOption)
        const webHookId = response.data.id
        await this.spaceClient.registerSubscription(url, webHookInfo, webHookId, axiosOption) // 웹훅이 등록이 된 후에 subscription을 등록
    }
}
