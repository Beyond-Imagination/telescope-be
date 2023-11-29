import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request } from 'express'
import { setFromToDate } from '@middlewares/date.middleware'

describe('setFromToDate', () => {
    it('should success with from and to', async () => {
        const req = getMockReq<Request>({ query: { from: '2020-01-01', to: '2020-01-02' } })
        const { res, next } = getMockRes({})

        await setFromToDate(7)(req, res, next)

        expect(req.fromDate).toBeTruthy()
        expect(req.toDate).toBeTruthy()
        expect(next).toBeCalledTimes(1)
    })

    it('should success without from and to', async () => {
        const req = getMockReq<Request>({})
        const { res, next } = getMockRes({})

        await setFromToDate(7)(req, res, next)

        expect(req.fromDate).toBeTruthy()
        expect(req.toDate).toBeTruthy()
        expect(next).toBeCalledTimes(1)
    })
})
