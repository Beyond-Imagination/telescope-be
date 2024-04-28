import { getMockReq, getMockRes } from '@jest-mock/express'
import { faker } from '@faker-js/faker'

import errorMiddleware from '@middlewares/error.middleware'
import { HttpException } from '@exceptions/HttpException'

describe('errorMiddleware', () => {
    it('should send error response', async () => {
        const req = getMockReq({})
        const { res, next } = getMockRes({})
        const err = new HttpException(faker.number.int(), 'error')

        errorMiddleware(err, req, res, next)

        expect(res.status).toBeCalledWith(err.status)
        expect(res.json).toBeCalledWith({ message: err.message })
    })
})
