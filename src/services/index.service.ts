import { Organization, OrganizationModel } from '@models/organization'
import { ChangeServerUrlDto, InstallAndUninstallDTO } from '@dtos/index.dtos'
import { mongooseTransactionHandler } from '@utils/util'
import { Achievement } from '@models/achievement'
import { SpaceClient } from '@/client/space.client'
import { ClientSession } from 'mongoose'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { deleteAllCacheByKeyPattern } from '@utils/cache.util'
import { Space } from '@/libs/space/space.lib'
import { space } from '@/types/space.type'
import Bottleneck from 'bottleneck'

export class IndexService {
    spaceClient = new SpaceClient()
    async install(dto: InstallAndUninstallDTO, axiosOption: any) {
        // 요 함수는 없어도 되지만 혹시 스페이스가 삭제시 에러가 발생해 스페이스가 지워지지 않았을 경우를 대비해 남겨둡니다
        await this.deleteOrganizationIfExist(dto.serverUrl)

        const installInfo = Space.getInstallInfo()
        const limiter = new Bottleneck({ maxConcurrent: 5, minTime: 100 })
        await Promise.all([
            // 아래의 API들은 상호 순서가 없고 병렬 처리가 가능하다
            limiter.schedule(() => this.spaceClient.requestPermissions(dto.serverUrl, dto.clientId, axiosOption, installInfo)),
            this.addWebhooks(dto.serverUrl, dto.clientId, installInfo, axiosOption).map(fn => {
                limiter.schedule(() => fn())
            }),
            limiter.schedule(() => this.spaceClient.registerUIExtension(dto.serverUrl, installInfo, axiosOption)),
        ])
        await this.insertDBData(dto, null)
    }

    async uninstall(dto: InstallAndUninstallDTO) {
        await this.deleteOrganizationIfExist(dto.serverUrl)
    }

    async changeServerUrl(dto: ChangeServerUrlDto) {
        // Prereq. controller에서 validation이 끝난 dto만 전달됩니다.
        await OrganizationModel.updateServerUrlByClientId(dto.clientId, dto.newServerUrl)
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
        return Object.values(installInfo.webhooks).map(webHookInfo => {
            return async () => {
                await this.addWebhook(webHookRegisterUrl, webHookInfo, axiosOption)
            }
        })
    }

    private async addWebhook(url: string, webHookInfo: space.webhookInfo, axiosOption: any) {
        const response = await this.spaceClient.registerWebHook(url, webHookInfo, axiosOption)
        const webHookId = response.data.id
        await this.spaceClient.registerSubscription(url, webHookInfo, webHookId, axiosOption) // 웹훅이 등록이 된 후에 subscription을 등록
    }
}
