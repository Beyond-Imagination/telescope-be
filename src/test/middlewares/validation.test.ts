import { webhookValidation, issueWebhookValidation } from '@middlewares/validation.middleware'
import { InvalidRequestException } from '@exceptions/InvalidRequestException'
import { mockingAxios, setTestDB, testAdmin, testClientId, testClientSecret, testSpaceURL } from '@/test/test.util'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'
import { OrganizationModel } from '@models/organization'
import { WrongClassNameException } from '@exceptions/WrongClassNameException'

describe('validation.middleware 모듈', () => {
    let body

    let req

    mockingAxios()

    setTestDB()

    beforeEach(() => {
        body = {
            serverUrl: testSpaceURL,
            clientId: testClientId,
            clientSecret: testClientSecret,
        }
        req = {
            body: body,
            headers: {
                'x-space-timestamp': 12345,
            },
        }
    })
    describe('testWebHookValidation 메소드에서', () => {
        describe('className이 InitPayload 일때', () => {
            beforeEach(() => {
                body['className'] = 'InitPayload'
            })

            it('public-key-signature가 정상적이지 않으면 에러가 발생한다', async () => {
                await expect(testWebHookValidation('Wrong signature!')).rejects.toThrowError(InvalidRequestException)
            })

            it('serverUrl이 .jetbrains.space로 끝나지 않으면 에러가 발생한다', async () => {
                body['serverUrl'] = 'https://wrong.url.com'
                await expect(
                    testWebHookValidation(
                        'Wi3wC9T8Ur6mRsftZ1IIPeCGkzaRpkwEy9ZRIm/t/r8h7ZCtGG8Nfkl+Lbvm1mfbT+KiXKmLSGa5T+EejENBa3gVdomV/KUAU/VqvOQ9KNkB+ajSXnfHOeGdsm+9GRT7KKeuVmjPmEOk6Kl00b3AwSZ6viDPGKtVRPN2cse/RkewPvM+GPypm58bYKwHd+ABWHCkfV9EtbKrAzLze5IGhdCscFULeXslsOTnpV5fIP4w1Eu/XtW4+5jo19ra7c4HrvP6EGv3IME2cvwD3B/ff106xDg4yyye3DgWhtEqAmipUlSObYvTFAHrRwCPNqaMjXFHmrJgJsUveTZL1bPJ9Q==',
                    ),
                ).rejects.toThrowError(InvalidRequestException)
            })

            it('정상 요청에 대해 webhookValidation가 성공한다', async () => {
                await expect(
                    testWebHookValidation(
                        'Wi3wC9T8Ur6mRsftZ1IIPeCGkzaRpkwEy9ZRIm/t/r8h7ZCtGG8Nfkl+Lbvm1mfbT+KiXKmLSGa5T+EejENBa3gVdomV/KUAU/VqvOQ9KNkB+ajSXnfHOeGdsm+9GRT7KKeuVmjPmEOk6Kl00b3AwSZ6viDPGKtVRPN2cse/RkewPvM+GPypm58bYKwHd+ABWHCkfV9EtbKrAzLze5IGhdCscFULeXslsOTnpV5fIP4w1Eu/XtW4+5jo19ra7c4HrvP6EGv3IME2cvwD3B/ff106xDg4yyye3DgWhtEqAmipUlSObYvTFAHrRwCPNqaMjXFHmrJgJsUveTZL1bPJ9Q==',
                    ),
                ).resolves.not.toThrow()
            })
        })

        describe('className이 AppPublicationCheckPayload 일때', () => {
            beforeEach(() => {
                body['className'] = 'AppPublicationCheckPayload'
            })

            it('항상 webhookValidation가 성공한다', async () => {
                await expect(testWebHookValidation('Whatever!')).resolves.not.toThrow()
            })
        })

        describe('className이 empty string 일떄', () => {
            beforeEach(() => {
                body['className'] = ''
            })

            it('WrongClassNameException 이 발생한다', async () => {
                await expect(testWebHookValidation('Whatever!')).rejects.toThrowError(WrongClassNameException)
            })
        })

        describe('className이 그 외의 경우 일때', () => {
            beforeEach(() => {
                body['className'] = 'Whatever'
            })

            it('Organization이 없으면 에러가 발생한다', async () => {
                await expect(testWebHookValidation('Whatever!')).rejects.toThrowError(OrganizationNotFoundException)
            })

            it('Organization이 존재하면 webhookValidation가 성공한다', async () => {
                await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testAdmin, null)
                await expect(
                    testWebHookValidation(
                        'khXVxzytjnPUHklP1YvJlT4WtTAzivvVg6kjIt35QRVsvPx8ViJF3dofP4P+r+ajoh8OkfNDMQb7Rhs/xub/V7rH0E9tv6Bcqww6ajO20vvXAtWvGtrc1WYiRZf1BCS/CC8glijJbxnKkp+Dv3XqyNa0BtV5vsTSyiyhdLOu2rxeg5ayQtAOYYp6yJHVQEXyixriNtGODl76sm4+zG0ghvn+nWp7l2ZyWkVIxVj+7PnL5j+lFSmSppPELYe80w1vTJ3y0l/Wxqo3o2BXH1PVwm49lHwtAU/zLtrydB2jY88CqyBtY5UEG3CzOJB4kBB9OY0Pk/br1N2EBeHOKvG1lA==',
                    ),
                ).resolves.not.toThrow()
            })
        })

        describe('payload의 className이 IssueWebhookEvent 일때', () => {
            beforeEach(() => {
                body = {
                    payload: {
                        className: 'IssueWebhookEvent',
                    },
                }
                req = {
                    body: body,
                }
            })

            it('항상 issueWebhookValidation가 성공한다', async () => {
                await expect(testIssueWebHookValidation()).resolves.not.toThrow()
            })
        })

        describe('payload의 className이 IssueWebhookEvent가 아닐 때', () => {
            beforeEach(() => {
                body = {
                    payload: {
                        className: 'whatever',
                    },
                }
                req = {
                    body: body,
                }
            })

            it('WrongClassNameException 이 발생한다', async () => {
                await expect(testIssueWebHookValidation()).rejects.toThrowError(WrongClassNameException)
            })
        })

        async function testWebHookValidation(publicKeySignature: string) {
            const res: any = {
                locals: {},
                status: jest.fn().mockReturnValue({ end: jest.fn() }),
            }
            const next = e => {
                if (e) throw e
            }
            req.headers['x-space-public-key-signature'] = publicKeySignature
            await webhookValidation(req, res, next)
        }

        async function testIssueWebHookValidation() {
            const res: any = {
                locals: {},
                status: jest.fn().mockReturnValue({ end: jest.fn() }),
            }
            const next = e => {
                if (e) throw e
            }
            await issueWebhookValidation(req, res, next)
        }
    })
})
