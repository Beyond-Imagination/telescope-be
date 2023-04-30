import {
    getTestAxiosOption,
    mockingAxios,
    setTestDB,
    testClientId,
    testClientSecret,
    testIssueId,
    testOrganizationAdmin,
    testSpaceURL,
} from '@/test/test.util'
import { IndexService } from '@services/index.service'
import { getAxiosOption, getBearerToken } from '@utils/verify.util'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { OrganizationModel } from '@models/organization'
import { AchievementModel, AchievementType } from '@models/achievement'
import { logger } from '@utils/logger'

describe('IndexService 클래스', () => {
    const sut = new IndexService()

    // 콘솔창에 로그가 남는걸 막는다
    logger.info = jest.fn()

    mockingAxios()

    setTestDB()

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
                        userId: testOrganizationAdmin,
                    },
                    getAxiosOption(await getBearerToken(testSpaceURL, testClientId, testClientSecret)),
                ),
            ).resolves.not.toThrowError()
        })

        // 요 테스트는 트랜잭션 에러로 가끔 실패 하는것 같은데 이유는 파악 못했습니다 ㅠㅠ 실패하면 30초정도 기다렸다가 다시 실행해주세요!
        it('재설치여도 정상적인 요청이면 성공한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdmin, null)
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testOrganizationAdmin,
                issueId: testIssueId,
                type: AchievementType.CreateCodeReview,
            })
            await expect(
                sut.install(
                    {
                        className: 'InitPayload',
                        clientSecret: testClientSecret,
                        serverUrl: testSpaceURL,
                        state: 'test',
                        clientId: testClientId,
                        userId: testOrganizationAdmin,
                    },
                    getTestAxiosOption(),
                ),
            ).resolves.not.toThrowError()
        })
    })

    describe('uninstall 메소드에서', () => {
        const sut = new IndexService()

        it('정상적인 삭제 요청이면 성공한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdmin, null)
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testOrganizationAdmin,
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
        })
        it('payload type이 payload.type.UNINSTALL가 아니면 에러가 발생한다', async () => {
            await expect(
                sut.uninstall({
                    className: 'whatever',
                    clientSecret: testClientSecret,
                    serverUrl: testSpaceURL,
                    state: 'test',
                    clientId: testClientId,
                    userId: testOrganizationAdmin,
                }),
            ).rejects.toThrowError(WrongClassNameException)
        })
        it('payload type이 payload.type.UNINSTALL가 아니면 에러가 발생한다', async () => {
            await expect(
                sut.uninstall({
                    className: 'InitPayload',
                    clientSecret: testClientSecret,
                    serverUrl: testSpaceURL,
                    state: 'test',
                    clientId: testClientId,
                    userId: testOrganizationAdmin,
                }),
            ).rejects.toThrowError(WrongClassNameException)
        })
    })

    describe('handleChangeServerUrl 메소드에서', () => {
        const sut = new IndexService()

        it('정상적인 요청이라면, 기존 serverUrl을 newServerUrl로 변경한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdmin, null)
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
    })
})
