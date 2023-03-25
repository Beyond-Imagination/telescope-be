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

    describe('handelInstallAndUninstall 메소드에서', () => {
        it('className이 InitPayload혹은 ApplicationUninstalledPayload가 아니면 에러가 발생한다', async () => {
            await expect(
                sut.handelInstallAndUninstall(
                    {
                        className: 'whatever',
                        clientSecret: testClientSecret,
                        serverUrl: testSpaceURL,
                        state: 'test',
                        clientId: testClientId,
                        userId: testOrganizationAdmin,
                    },
                    getAxiosOption(await getBearerToken(testSpaceURL, testClientId, testClientSecret)),
                ),
            ).rejects.toThrowError(WrongClassNameException)
        })

        it('최초 설치시에 정상적인 요청이면 성공한다', async () => {
            await expect(
                sut.handelInstallAndUninstall(
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
                sut.handelInstallAndUninstall(
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

        it('정상적인 삭제 요청이면 성공한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testOrganizationAdmin, null)
            await AchievementModel.saveAchievement({
                clientId: testClientId,
                user: testOrganizationAdmin,
                issueId: testIssueId,
                type: AchievementType.CreateCodeReview,
            })
            await expect(
                sut.handelInstallAndUninstall(
                    {
                        className: 'InitPayload',
                        clientSecret: undefined,
                        serverUrl: testSpaceURL,
                        state: undefined,
                        clientId: testClientId,
                        userId: undefined,
                    },
                    getTestAxiosOption(),
                ),
            ).resolves.not.toThrowError()
        })
    })
})
