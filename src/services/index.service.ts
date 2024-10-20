import { Organization, OrganizationModel, Webhooks } from '@models/organization'
import { ChangeServerUrlDto, InstallAndUninstallDTO, MessagePayloadDto } from '@dtos/index.dtos'
import { mongooseTransactionHandler } from '@utils/util'
import { Achievement } from '@models/achievement'
import { SpaceClient } from '@/client/space.client'
import { ClientSession } from 'mongoose'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { deleteAllCacheByKeyPattern } from '@utils/cache.util'
import { Space } from '@/libs/space/space.lib'
import { space } from '@/types/space.type'
import Bottleneck from 'bottleneck'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { StarService } from '@services/star.service'
import { BOTTLENECK_MAX_CONCURRENT, BOTTLENECK_MIN_TIME } from '@config'

export class IndexService {
    spaceClient = SpaceClient.getInstance()
    starService = StarService.getInstance()

    async install(dto: InstallAndUninstallDTO, axiosOption: any) {
        // 요 함수는 없어도 되지만 혹시 스페이스가 삭제시 에러가 발생해 스페이스가 지워지지 않았을 경우를 대비해 남겨둡니다
        await this.deleteOrganizationIfExist(dto.serverUrl)

        const installInfo = Space.getInstallInfo()
        const webhooks = new Webhooks()
        const limiter = new Bottleneck({ maxConcurrent: BOTTLENECK_MAX_CONCURRENT, minTime: BOTTLENECK_MIN_TIME })
        await limiter.schedule(() => {
            return Promise.all([
                // 아래의 API들은 상호 순서가 없고 병렬 처리가 가능하다
                this.spaceClient.requestPermissions(dto.serverUrl, dto.clientId, axiosOption, installInfo),
                this.spaceClient.getApplicationInfo(dto.serverUrl, dto.clientId, axiosOption).then(applicationInfo => {
                    // 설치 완료후 홈페이지 화면으로 유도하기위해 applicationName을 알야아 한다
                    const applicationName = applicationInfo.data.name + '-' + applicationInfo.data.id
                    this.spaceClient.registerUIExtension(dto.serverUrl, installInfo, applicationName, axiosOption)
                }),
                ...this.addWebhooks(dto.serverUrl, dto.clientId, installInfo, webhooks, axiosOption),
            ])
        })
        await Organization.saveOrganization(dto.clientId, dto.clientSecret, dto.serverUrl, dto.userId, webhooks, null)
    }

    async uninstall(dto: InstallAndUninstallDTO) {
        // unit test를 위해서 validation을 한번 더 수행하였습니다.
        if (dto.className !== space.className.UNINSTALL) throw new WrongClassNameException()
        await this.deleteOrganizationIfExist(dto.serverUrl)
    }

    async changeServerUrl(dto: ChangeServerUrlDto) {
        // Prereq. controller에서 validation이 끝난 dto만 전달됩니다.
        await Promise.all([
            OrganizationModel.updateServerUrlByClientId(dto.clientId, dto.newServerUrl),
            deleteAllCacheByKeyPattern(new RegExp(`.*${dto.clientId}.*`)),
        ])
    }

    async message(dto: MessagePayloadDto, axiosOption: any) {
        const list = dto.message.body.text.split(' ')
        const organization = await OrganizationModel.findByClientId(dto.clientId)
        switch (list[0]) {
            case 'remainStars':
                await this.starService.notifyRemainStar(organization.serverUrl, organization.clientId, dto.userId, axiosOption)
                break
            default:
                await this.spaceClient.sendMessage(organization.serverUrl, axiosOption, dto.userId, 'Invalid Command')
                break
        }
    }

    listCommand() {
        return {
            commands: [
                {
                    name: 'remainStars',
                    description: 'Gets the number of remaining sendable stars.',
                },
            ],
        }
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

    private addWebhooks(url: string, clientId: string, installInfo: space.installInfo, webhooks: Webhooks, axiosOption: any) {
        const webHookRegisterUrl = `${url}/api/http/applications/clientId:${clientId}/webhooks`
        return Object.values(installInfo.webhooks).map(webHookInfo => {
            return new Promise<void>(async (resolve, reject) => {
                try {
                    await this.addWebhook(webHookRegisterUrl, webHookInfo, webhooks, axiosOption)
                    resolve()
                } catch (e) {
                    reject(e)
                }
            })
        })
    }

    private async addWebhook(url: string, webHookInfo: space.webhookInfo, webhooks: Webhooks, axiosOption: any) {
        const webhookName = space.webhookNameCamelCase(webHookInfo.name)
        const webhookResponse = await this.spaceClient.registerWebHook(url, webHookInfo, axiosOption)
        webhooks[webhookName] = {
            webhookId: webhookResponse.data.id,
            subscriptionId: webhookResponse.data.subscriptions?.[0]?.id,
        }
    }
}
