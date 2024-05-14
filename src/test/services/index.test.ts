import {
    getTestAxiosOption,
    mockingAxios,
    setTestDB,
    spySpaceClient,
    testClientId,
    testClientSecret,
    testIssueId,
    testOrganizationAdminId,
    testSpaceURL,
    testWebhooks,
} from '@/test/test.util'
import { IndexService } from '@services/index.service'
import { getAxiosOption, getBearerToken } from '@utils/verify.util'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { Organization, OrganizationModel } from '@models/organization'
import { AchievementModel, AchievementType } from '@models/achievement'
import { logger } from '@utils/logger'
import { Space } from '@/libs/space/space.lib'

describe('IndexService 클래스', () => {
    const sut = new IndexService()

    // 콘솔창에 로그가 남는걸 막는다
    logger.info = jest.fn()

    mockingAxios()

    setTestDB()

    spySpaceClient(sut.spaceClient)

    describe('install 메소드에서', () => {
        it('최초 설치시에 정상적인 요청이면 성공한다', async () => {
            await expect(
                sut.install(
                    {
                        className: 'InitPayload',
                        clientSecret: testClientSecret,
                        serverUrl: testSpaceURL,
                        state: 'test',
                        clientId: testClientId,
                        userId: testOrganizationAdminId,
                    },
                    getAxiosOption(await getBearerToken(testSpaceURL, testClientId, testClientSecret)),
                ),
            ).resolves.not.toThrowError()
            const installInfo = Space.getInstallInfo('latest')
            expect(sut.spaceClient.registerWebHook).toBeCalledTimes(Object.keys(installInfo.webhooks).length)
        })

        it('재설치인 경우 이전 정보는 날라간다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdminId, testWebhooks, null)
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testOrganizationAdminId,
                issueId: testIssueId,
                type: AchievementType.CreateCodeReview,
            })
            const originFn = Organization.saveOrganization

            Organization.saveOrganization = jest.fn().mockRejectedValue(new Error('save되기전에 데이터가 지워지는지 확인하기위해 던짐'))

            try {
                await sut.install(
                    {
                        className: 'InitPayload',
                        clientSecret: testClientSecret,
                        serverUrl: testSpaceURL,
                        state: 'test',
                        clientId: testClientId,
                        userId: testOrganizationAdminId,
                    },
                    getTestAxiosOption(),
                )
            } catch (ignored) {}

            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
            await expect(OrganizationModel.countDocuments({}).exec()).resolves.toBe(0)
            Organization.saveOrganization = originFn
        })

        it('재설치여도 정상적인 요청이면 성공한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdminId, testWebhooks, null)
            await expect(
                sut.install(
                    {
                        className: 'InitPayload',
                        clientSecret: testClientSecret,
                        serverUrl: testSpaceURL,
                        state: 'test',
                        clientId: testClientId,
                        userId: testOrganizationAdminId,
                    },
                    getTestAxiosOption(),
                ),
            ).resolves.not.toThrowError()
        })
    })

    describe('uninstall 메소드에서', () => {
        it('정상적인 삭제 요청이면 성공한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdminId, testWebhooks, null)
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testOrganizationAdminId,
                issueId: testIssueId,
                type: AchievementType.CreateCodeReview,
            })
            await expect(
                sut.uninstall({
                    className: 'ApplicationUninstalledPayload',
                    clientSecret: undefined,
                    serverUrl: testSpaceURL,
                    state: undefined,
                    clientId: testClientId,
                    userId: undefined,
                }),
            ).resolves.not.toThrowError()
            await expect(AchievementModel.countDocuments({}).exec()).resolves.toBe(0)
            await expect(OrganizationModel.countDocuments({}).exec()).resolves.toBe(0)
        })

        it('payload type이 payload.type.UNINSTALL가 아니면 에러가 발생한다', async () => {
            await expect(
                sut.uninstall({
                    className: 'whatever',
                    clientSecret: testClientSecret,
                    serverUrl: testSpaceURL,
                    state: 'test',
                    clientId: testClientId,
                    userId: testOrganizationAdminId,
                }),
            ).rejects.toThrowError(WrongClassNameException)
        })

        it('존재하지 않는 Organization을 삭제하려고 해도 에러가 발생하지 않는다', async () => {
            await expect(
                sut.uninstall({
                    className: 'ApplicationUninstalledPayload',
                    clientSecret: undefined,
                    serverUrl: testSpaceURL,
                    state: undefined,
                    clientId: testClientId,
                    userId: undefined,
                }),
            ).resolves.not.toThrowError()
        })
    })

    describe('handleChangeServerUrl 메소드에서', () => {
        it('정상적인 요청이라면, 기존 serverUrl을 newServerUrl로 변경한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdminId, testWebhooks, null)
            const newTestUrl = 'https://joonamin44.jetbrains.space'
            await sut.changeServerUrl({
                className: 'ChangeServerUrlPayload',
                newServerUrl: testSpaceURL,
                clientId: testClientId,
                userId: undefined,
                verificationToken: undefined,
            })
            const target = await OrganizationModel.findByClientId(testClientId)
            expect(target.serverUrl === newTestUrl)
        })

        it('존재하지 않는 Organization을 변경하려고 해도 에러가 발생하지 않는다', async () => {
            await expect(
                sut.changeServerUrl({
                    className: 'ChangeServerUrlPayload',
                    newServerUrl: testSpaceURL,
                    clientId: testClientId,
                    userId: undefined,
                    verificationToken: undefined,
                }),
            ).resolves.not.toThrowError()
        })
    })

    describe('message 메소드에서', () => {
        it('remainStars 명령어를 받으면, starService.notifyRemainStar를 호출한다', async () => {
            const originFn = sut.starService.notifyRemainStar
            sut.starService.notifyRemainStar = jest.fn()
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdminId, testWebhooks, null)
            await sut.message(
                {
                    clientId: testClientId,
                    userId: testOrganizationAdminId,
                    message: {
                        body: {
                            text: 'remainStars',
                        },
                    },
                },
                getTestAxiosOption(),
            )
            expect(sut.starService.notifyRemainStar).toBeCalled()
            sut.starService.notifyRemainStar = originFn
        })

        it('remainStars 명령어가 아닌 다른 명령어를 받으면, Invalid Command 메시지를 보낸다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdminId, testWebhooks, null)
            const axiosOption = getTestAxiosOption()
            await sut.message(
                {
                    clientId: testClientId,
                    userId: testOrganizationAdminId,
                    message: {
                        body: {
                            text: 'whatever',
                        },
                    },
                },
                axiosOption,
            )
            expect(sut.spaceClient.sendMessage).toBeCalledWith(testSpaceURL, axiosOption, testOrganizationAdminId, 'Invalid Command')
        })
    })

    describe('listCommand 메소드에서', () => {
        it('명령어 리스트를 반환한다', () => {
            expect(sut.listCommand()).toEqual({
                commands: [
                    {
                        name: 'remainStars',
                        description: 'Gets the number of remaining sendable stars.',
                    },
                ],
            })
        })
    })
})
