import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import { Point, Webhooks } from '@models/organization'
import { VERSION } from '@config'
import { InMemoryDB } from '@/test/inMemoryDB'
import { getAxiosOption, getBearerToken } from '@utils/verify.util'
import { clearCache } from '@utils/cache.util'
import bcrypt from 'bcrypt'
import { SpaceClient } from '@/client/space.client'
import ProvidesHookCallback = jest.ProvidesHookCallback

export const testSpaceURL = 'https://test.jetbrains.space'
export const testClientId = 'test_client_id'
export const testClientSecret = 'test_client_secret'
export const testApplicationId = 'test_application_id'
export const testOrganizationAdminId = 'testAdminId'
export const testProjectId = 'testProjectId'
export const testIssueId = 'issueId'
export const testWebhookId = 'testWebhookId'
export const testSubscriptionId = 'testSubscriptionId'
export const testUserId = 'testUserId'
export const testMessageId = 'testMessageId'
export const testChannelId = 'testChannelId'
export const testDiscussionId = 'testDiscussionId'
export const testReviewId = 'testReviewId'
export const testRepositoryId = 'testRepositoryId'

export const testWebhooks = new Webhooks()

export const testAdminEmail = 'testAdmin@email.com'
export const testAdminPassword = 'testAdminPassword'
export const testAdminHashedPassword = bcrypt.hashSync(testAdminPassword, 12)
export const testAdminName = 'testAdminName'
export const testUserName = 'testUserName'
export const testProfilePicture = 'testProfilePicture'

export const mockOrganization = {
    clientId: testClientId,
    clientSecret: testClientSecret,
    serverUrl: testSpaceURL,
    admin: [testOrganizationAdminId],
    points: new Point(),
    webhooks: testWebhooks,
    version: VERSION,
    createdAt: new Date(),
    __v: 0,
    _id: '000000000000',
}

// mocking이 필요한 axios 요청 들을 정의한 함수
export function mockingAxios() {
    const mockAxios = new MockAdapter(axios)

    // bearer token 얻는 부분을 mocking
    mockAxios.onPost(`${testSpaceURL}/oauth/token`).reply(200, {
        access_token: 'test_bearer_Token',
    })

    // 권한 등록 하는 부분을 mocking
    mockAxios.onPatch(`${testSpaceURL}/api/http/applications/clientId:${testClientId}/authorizations/authorized-rights/request-rights`).reply(200)

    // space의 publicKey 얻어오는 과정을 mocking
    mockAxios.onGet(`${testSpaceURL}/api/http/applications/clientId:${testClientId}/public-keys`).reply(200, {
        keys: [
            {
                kty: 'RSA',
                n: 'yQalZOCzGvdxWb2STuu1WVGFG4Cl4X4sIFy3yLG901IgwTuJhpu3FDJi8VwHQzzHLM-1tOW8cTEvfUXIFwKolz6iAEKdVPC5ITWBPejrXaTAqVkPkQUMitsvUK2F32zetlwuPMavjysN60hstOPaFLs8cJ4lodE_Pc2aN8maVl3UGO0uP_cqkuAT8OZ-pxAv-5BVl9Sbs-FK_LV6koIHMSXaFcZIbVnTUrObq8vJVHjoaPdYlBm6HLLVqf8YMCrmClHAjvlB-9L_2G-3mbBDDezAHxO75D1NbCdkir0vXpFJrPQ0L6TPxQoGwgrYhsvhxpWxmyXcEgFx4lTIti_Yrw',
                e: 'AQAB',
                alg: 'RS512',
                use: 'sig',
            },
        ],
    })
    mockAxios.onGet(`${testSpaceURL}/api/http/applications/clientId:${testClientId}`).reply(200, {
        name: 'Telescope',
        id: testApplicationId,
    })
    // 웹훅 등록하는 부분을 mocking
    mockAxios.onPost(`${testSpaceURL}/api/http/applications/clientId:${testClientId}/webhooks`).reply(200, { id: testWebhookId })

    // subscription 등록하는 부분을 mocking
    mockAxios
        .onPost(`${testSpaceURL}/api/http/applications/clientId:${testClientId}/webhooks/${testWebhookId}/subscriptions`)
        .reply(200, { id: testSubscriptionId })

    // ui-extension 등록하는 부분을 mocking
    mockAxios.onPatch(`${testSpaceURL}/api/http/applications/ui-extensions`).reply(200)

    // 사용자들의 프로필을 가져오는 부분을 mocking
    mockAxios.onGet(`${testSpaceURL}/api/http/team-directory/profiles`).reply(200, {
        data: [
            {
                profilePicture: testProfilePicture,
                id: testOrganizationAdminId,
                name: { firstName: '', lastName: testAdminName },
            },
            {
                profilePicture: testProfilePicture,
                id: testUserId,
                name: { firstName: '', lastName: testUserName },
            },
        ],
        totalCount: 2,
    })

    // 코드리뷰 정보를 가져오는 부분을 mocking
    mockAxios
        .onGet(new RegExp(`${testSpaceURL}/api/http/projects/key:.*`))
        .reply(200, { createdBy: { id: testOrganizationAdminId }, branchPairs: [{ isMerged: true }] })

    // 사용자에게 메시지 보내는 부분을 mocking
    mockAxios.onPost(`${testSpaceURL}/api/http/chats/messages/send-message`).reply(200)

    // 메지지 정보를 가져오는 부분을 mocking
    mockAxios.onGet(`${testSpaceURL}/api/http/chats/messages/id:${testMessageId}`).reply(200, {
        author: {
            details: {
                user: {
                    id: testUserId,
                },
            },
            name: testUserId,
        },
    })
}

export function setTestDB(beforeEachFun: ProvidesHookCallback = null) {
    beforeAll(async () => await InMemoryDB.connect())
    if (beforeEachFun) beforeEach(beforeEachFun)
    afterEach(async () => {
        // 캐시로 인한 영향 제거
        clearCache()
        await InMemoryDB.clearDatabase()
    })
    afterAll(async () => await InMemoryDB.closeDatabase())
}

export async function getTestAxiosOption() {
    return getAxiosOption(await getBearerToken(testSpaceURL, testClientId, testClientSecret))
}

export function spySpaceClient(spaceClient: SpaceClient) {
    Object.getOwnPropertyNames(Object.getPrototypeOf(spaceClient)).forEach(name => {
        if (typeof spaceClient[name] == 'function') {
            jest.spyOn(spaceClient, name as any)
        }
    })
}
