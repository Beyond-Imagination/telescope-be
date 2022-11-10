import { WebhookService } from '@services/webhook.service'
import {
    getTestAxiosOption,
    mockingAxios,
    setTestDB,
    testAdmin,
    testClientId,
    testClientSecret,
    testIssueId,
    testSpaceURL,
    testWebhookId,
} from '@/test/testUtils'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { OrganizationModel } from '@models/organization'

describe('WebhookService 클래스', () => {
    const sut = new WebhookService()
    let codeReviewDto

    mockingAxios()

    setTestDB(async () => {
        await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testAdmin, null)
        codeReviewDto = {
            clientId: testClientId,

            payload: {
                className: 'CodeReviewWebhookEvent',
                isMergeRequest: true,
                projectKey: {
                    key: '',
                },
                repository: '',
                reviewId: testIssueId,
                title: '',
            },

            verificationToken: '',

            webhookId: testWebhookId,
        }
    })

    describe('handleCodeReviewWebHook 메소드에서', () => {
        describe('코드리뷰가 생성될때', () => {
            it('className이 CodeReviewWebhookEvent가 아니면 에러가 발생한다', async () => {
                codeReviewDto.payload.className = 'whatever'
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, getTestAxiosOption(), true)).rejects.toThrowError(WrongClassNameException)
            })

            it('없는 organization이면 에러가 발생한다', async () => {
                codeReviewDto.clientId = 'whatever'
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, getTestAxiosOption(), true)).rejects.toThrowError(
                    OrganizationNotFoundException,
                )
            })

            it('정상적인 요청이면 성공한다', async () => {
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, getTestAxiosOption(), true)).resolves.not.toThrowError(
                    WrongClassNameException,
                )
            })
        })

        describe('MR이 머지될때', () => {
            it('className이 CodeReviewWebhookEvent가 아니면 에러가 발생한다', async () => {
                codeReviewDto.payload.className = 'whatever'
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, getTestAxiosOption(), false)).rejects.toThrowError(WrongClassNameException)
            })

            it('없는 organization이면 에러가 발생한다', async () => {
                codeReviewDto.clientId = 'whatever'
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, getTestAxiosOption(), false)).rejects.toThrowError(
                    OrganizationNotFoundException,
                )
            })

            it('정상적인 요청이면 성공한다', async () => {
                await expect(sut.handleCodeReviewWebHook(codeReviewDto, getTestAxiosOption(), false)).resolves.not.toThrowError(
                    WrongClassNameException,
                )
            })
        })
    })
})
