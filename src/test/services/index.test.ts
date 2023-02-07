import { getTestAxiosOption, mockingAxios, setTestDB, testAdmin, testClientId, testClientSecret, testIssueId, testSpaceURL } from '@/test/test.util'
import { IndexService } from '@services/index.service'
import { getAxiosOption, getBearerToken } from '@utils/verify.util'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { OrganizationModel } from '@models/organization'
import { AchievementModel, AchievementType } from '@models/achievement'

describe('IndexService 클래스', () => {
    const sut = new IndexService()

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
                        userId: testAdmin,
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
                        userId: testAdmin,
                    },
                    getAxiosOption(await getBearerToken(testSpaceURL, testClientId, testClientSecret)),
                ),
            ).resolves.not.toThrowError()
        })

        // 요 테스트는 트랜잭션 에러로 가끔 실패 하는것 같은데 이유는 파악 못했습니다 ㅠㅠ 실패하면 30초정도 기다렸다가 다시 실행해주세요!
        it('재설치여도 정상적인 요청이면 성공한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testAdmin, null)
            await AchievementModel.saveAchievement(testClientId, testAdmin, testIssueId, AchievementType.CreateCodeReview)
            await expect(
                sut.handelInstallAndUninstall(
                    {
                        className: 'InitPayload',
                        clientSecret: testClientSecret,
                        serverUrl: testSpaceURL,
                        state: 'test',
                        clientId: testClientId,
                        userId: testAdmin,
                    },
                    getTestAxiosOption(),
                ),
            ).resolves.not.toThrowError()
        })

        it('정상적인 삭제 요청이면 성공한다', async () => {
            await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testAdmin, null)
            await AchievementModel.saveAchievement(testClientId, testAdmin, testIssueId, AchievementType.CreateCodeReview)
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
