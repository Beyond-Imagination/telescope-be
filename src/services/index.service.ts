import { Organization, OrganizationModel } from '@models/organization'
import { InstallAndUninstallDTO, LogDto } from '@dtos/index.dtos'
import { WebHookInfo } from '@dtos/WebHookInfo'
import { mongooseTransactionHandler } from '@utils/util'
import { Achievement } from '@models/achievement'
import { SpaceClient } from '@/client/space.client'
import { ClientSession } from 'mongoose'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { deleteAllCacheByKeyPattern, deleteCache } from '@utils/cache.util'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { logger } from '@utils/logger'

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

    async handelInstallAndUninstall(dto: InstallAndUninstallDTO, axiosOption: any) {
        let logType
        switch (dto.className) {
            case 'InitPayload':
                await this.install(dto, axiosOption)
                logType = 'Install'
                break
            case 'ApplicationUninstalledPayload':
                await this.uninstall(dto)
                logType = 'Uninstall'
                break
            default:
                throw new WrongClassNameException()
        }
        logger.info(JSON.stringify(new LogDto(logType, dto.serverUrl)))
    }

    private async install(dto: InstallAndUninstallDTO, axiosOption: any) {
        // 요 함수는 없어도 되지만 혹시 스페이스가 삭제시 에러가 발생해 스페이스가 지워지지 않았을 경우를 대비해 남겨둡니다
        await this.deleteOrganizationIfExist(dto.serverUrl)

        const transactionHandlerMethod = async (session: ClientSession): Promise<void> => {
            // Transaction이 필요한 operation들은 요 메소드 안에 넣는다
            await this.insertDBData(dto, session)

            await Promise.all([
                // 아래의 API들은 상호 순서가 없고 병렬 처리가 가능하다
                this.spaceClient.requestPermissions(dto.serverUrl, dto.clientId, axiosOption, this.rightCodes),
                this.addWebhooks(dto.serverUrl, dto.clientId, axiosOption),
                this.spaceClient.registerUIExtension(dto.serverUrl, axiosOption),
            ])
        }

        await mongooseTransactionHandler(transactionHandlerMethod)
    }

    private async uninstall(dto: InstallAndUninstallDTO) {
        await this.deleteOrganizationIfExist(dto.serverUrl)
    }

    private async deleteOrganizationIfExist(serverUrl: string) {
        let organization: Organization
        try {
            organization = await OrganizationModel.findByServerUrl(serverUrl)
        } catch (e) {
            if (e instanceof OrganizationNotFoundException) {
                // 아래 코드가 없으면 OrganizationNotFoundException를 던지는 promise가 캐싱되어
                // 이후 findByServerUrl 호출시 OrganizationNotFoundException가 throw된다.
                deleteCache(`findByServerUrl_${serverUrl}`)
                return
            } else {
                throw e
            }
        }

        const transactionHandlerMethod = async (session: ClientSession): Promise<void> => {
            await Promise.all([
                // 기존 application정보를 전부 지운다
                Achievement.deleteAllByClientId(organization.clientId, session),
                Organization.deleteAllByClientId(organization.clientId, session),
                // 캐싱된 서버 정보를 전부 삭제
                deleteAllCacheByKeyPattern(new RegExp(`.*${organization.clientId}.*`)),
                deleteAllCacheByKeyPattern(new RegExp(`.*${organization.serverUrl}.*`)),
            ])
        }
        await mongooseTransactionHandler(transactionHandlerMethod)
    }

    private async insertDBData(dto: InstallAndUninstallDTO, session: ClientSession) {
        await Organization.saveOrganization(dto.clientId, dto.clientSecret, dto.serverUrl, dto.userId, session)
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
