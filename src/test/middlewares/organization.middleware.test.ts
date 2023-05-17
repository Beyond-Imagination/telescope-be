import { Request } from 'express'
import { getMockReq, getMockRes } from '@jest-mock/express'
import { faker } from '@faker-js/faker'

import { setOrganizationByClientId, setOrganizationByServerUrl } from '@middlewares/organization.middleware'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'

jest.mock('@models/organization', () => {
    return {
        OrganizationModel: {
            findByServerUrl: jest.fn(() => 'organization'),
            findByClientId: jest.fn(() => 'organization'),
        },
    }
})

describe('setOrganizationByServerUrl', () => {
    it('should fail without serverUrl', () => {
        const req = getMockReq({})
        const { res, next } = getMockRes({})

        setOrganizationByServerUrl(req, res, next)

        expect(next).nthCalledWith(1, new OrganizationNotFoundException())
    })

    it('should success with serverUrl in body', async () => {
        const req = getMockReq<Request>({ body: { serverUrl: faker.internet.url() } })
        const { res, next } = getMockRes({})

        await setOrganizationByServerUrl(req, res, next)

        expect(req.organization).toBeTruthy()
        expect(next).toBeCalledTimes(1)
        expect(next).not.toBeCalledWith(new OrganizationNotFoundException())
    })

    it('should success with serverUrl in query', async () => {
        const req = getMockReq<Request>({ query: { serverUrl: faker.internet.url() } })
        const { res, next } = getMockRes({})

        await setOrganizationByServerUrl(req, res, next)

        expect(req.organization).toBeTruthy()
        expect(next).toBeCalledTimes(1)
        expect(next).not.toBeCalledWith(new OrganizationNotFoundException())
    })
})

describe('setOrganizationByClientId', () => {
    it('should fail without clientId', () => {
        const req = getMockReq({})
        const { res, next } = getMockRes({})

        setOrganizationByClientId(req, res, next)

        expect(next).nthCalledWith(1, new OrganizationNotFoundException())
    })

    it('should success with clientId in body', async () => {
        const req = getMockReq<Request>({ body: { clientId: faker.string.uuid() } })
        const { res, next } = getMockRes({})

        await setOrganizationByClientId(req, res, next)

        expect(req.organization).toBeTruthy()
        expect(next).toBeCalledTimes(1)
        expect(next).not.toBeCalledWith(new OrganizationNotFoundException())
    })
})
