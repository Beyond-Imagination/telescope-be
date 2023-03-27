import { Organization, OrganizationModel } from '@models/organization'
import { InstallAndUninstallDTO, LogDto } from '@dtos/index.dtos'
import { mongooseTransactionHandler } from '@utils/util'
import { Achievement } from '@models/achievement'
import { SpaceClient } from '@/client/space.client'
import { ClientSession } from 'mongoose'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { deleteAllCacheByKeyPattern } from '@utils/cache.util'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { logger } from '@utils/logger'
import { Space } from '@/libs/space/space.lib'
import { space } from '@/types/space.type'

export class IndexService {
    spaceClient = new SpaceClient()

    async handleInstallAndUninstall(dto: InstallAndUninstallDTO, axiosOption: any) {
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

        const installInfo = Space.getInstallInfo()
        const transactionHandlerMethod = async (session: ClientSession): Promise<void> => {
            // Transaction이 필요한 operation들은 요 메소드 안에 넣는다
            await this.insertDBData(dto, session)

            await Promise.all([
                // 아래의 API들은 상호 순서가 없고 병렬 처리가 가능하다
                this.spaceClient.requestPermissions(dto.serverUrl, dto.clientId, axiosOption, installInfo),
                this.addWebhooks(dto.serverUrl, dto.clientId, installInfo, axiosOption),
                this.spaceClient.registerUIExtension(dto.serverUrl, installInfo, axiosOption),
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

    private addWebhooks(url: string, clientId: string, installInfo: space.installInfo, axiosOption: any) {
        const webHookRegisterUrl = `${url}/api/http/applications/clientId:${clientId}/webhooks`
        return installInfo.webhooks.map(webHookInfo => {
            return this.addWebhook(webHookRegisterUrl, webHookInfo, axiosOption)
        })
    }

    private async addWebhook(url: string, webHookInfo: space.webhookInfo, axiosOption: any) {
        const response = await this.spaceClient.registerWebHook(url, webHookInfo, axiosOption)
        const webHookId = response.data.id
        await this.spaceClient.registerSubscription(url, webHookInfo, webHookId, axiosOption) // 웹훅이 등록이 된 후에 subscription을 등록
    }
}
