import { setTestDB, testAdminEmail, testAdminHashedPassword, testAdminName, testAdminPassword } from '@/test/test.util'
import { AdminService } from '@services/admin.service'
import { AdminModel } from '@models/admin'
import { AdminExistException } from '@exceptions/AdminExistException'
import { AdminNotFoundException } from '@exceptions/AdminNotFoundException'
import { AdminNotApprovedException } from '@exceptions/AdminNotApprovedException'
import { AdminSortType } from '@dtos/admin.dtos'
import { AdminApprovedException } from '@exceptions/AdminApprovedException'
import { AdminRejectException } from '@exceptions/AdminRejectException'
import { checkTokenIsRevoked } from '@utils/cache.util'

describe('AdminService 클래스', () => {
    const sut = new AdminService()

    setTestDB()

    describe('register 메소드에서', () => {
        it('이미 가입된 정보로 다시 가입하면 에러가 발생한다.', async () => {
            await AdminModel.saveAdmin(testAdminEmail, testAdminPassword, testAdminName)
            await expect(
                sut.register({
                    email: testAdminEmail,
                    password: testAdminPassword,
                    name: testAdminName,
                }),
            ).rejects.toThrowError(AdminExistException)
        })

        it('정상적인 가입 요청이면 성공한다', async () => {
            await expect(
                sut.register({
                    email: testAdminEmail,
                    password: testAdminPassword,
                    name: testAdminName,
                }),
            ).resolves.not.toThrowError()
        })
    })

    describe('login 메소드에서', () => {
        it('가입한적이 없는 어드민으로 로그인하면 에러가 발생한다.', async () => {
            await expect(
                sut.login({
                    email: testAdminEmail,
                    password: testAdminPassword,
                }),
            ).rejects.toThrowError(AdminNotFoundException)
        })

        it('존재하는 어드민에 잘못된 비밀번호로 로그인하면 에러가 발생한다.', async () => {
            await AdminModel.saveAdmin(testAdminEmail, testAdminPassword, testAdminName)
            await expect(
                sut.login({
                    email: testAdminEmail,
                    password: 'Whatever',
                }),
            ).rejects.toThrowError(AdminNotFoundException)
        })

        it('아직 승인되지 않는 어드민이 로그인하면 에러가 발생한다.', async () => {
            await AdminModel.saveAdmin(testAdminEmail, testAdminPassword, testAdminName)
            await expect(
                sut.login({
                    email: testAdminEmail,
                    password: testAdminPassword,
                }),
            ).rejects.toThrowError(AdminNotApprovedException)
        })

        it('정상적인 요청이면 성공한다', async () => {
            await new AdminModel({
                email: testAdminEmail,
                password: testAdminHashedPassword,
                name: testAdminName,
                registeredAt: new Date(),
                approved: true,
            }).save()
            await expect(
                sut.login({
                    email: testAdminEmail,
                    password: testAdminPassword,
                }),
            ).resolves.not.toThrowError()
        })
    })

    describe('approve 메소드에서', () => {
        it('존재하지 않는 관리자를 승인하면 에러가 발생한다.', async () => {
            await expect(sut.approve('whatever1234')).rejects.toThrowError(AdminNotFoundException)
        })

        it('이미 승인된 관리자를 승인하면 에러가 발생한다.', async () => {
            await new AdminModel({
                email: testAdminEmail,
                password: testAdminHashedPassword,
                name: testAdminName,
                registeredAt: new Date(),
                approved: true,
            }).save()
            const admin = await AdminModel.findByEmail(testAdminEmail)
            await expect(sut.approve(admin._id.toString())).rejects.toThrowError(AdminApprovedException)
        })

        it('정상적인 요청이면 성공한다', async () => {
            await AdminModel.saveAdmin(testAdminEmail, testAdminPassword, testAdminName)
            let admin = await AdminModel.findByEmail(testAdminEmail)
            await expect(sut.approve(admin._id.toString())).resolves.not.toThrowError()
            admin = await AdminModel.findByIdCached(admin._id.toString())
            expect(admin.approved).toBeTruthy()
        })
    })

    describe('reject 메소드에서', () => {
        beforeEach(async () => {
            await new AdminModel({
                email: testAdminEmail,
                password: testAdminHashedPassword,
                name: testAdminName,
                registeredAt: new Date(),
                approved: true,
            }).save()
        })

        it('존재하지 않는 관리자를 승인 취소하면 에러가 발생한다.', async () => {
            const admin = await AdminModel.findByEmail(testAdminEmail)
            await expect(sut.reject(admin, 'whatever1234')).rejects.toThrowError(AdminNotFoundException)
        })

        it('스스로를 승인 취소하면 에러가 발생한다.', async () => {
            const admin = await AdminModel.findByEmail(testAdminEmail)
            await expect(sut.reject(admin, admin._id.toString())).rejects.toThrowError(AdminRejectException)
        })

        it('정상적인 요청이면 성공한다', async () => {
            const admin = await AdminModel.findByEmail(testAdminEmail)
            const targetTestAdminEmail = testAdminEmail + '2'
            await new AdminModel({
                email: targetTestAdminEmail,
                password: testAdminHashedPassword,
                name: testAdminName,
                registeredAt: new Date(),
                approved: true,
            }).save()
            let targetAdmin = await AdminModel.findByEmail(targetTestAdminEmail)
            await expect(sut.reject(admin, targetAdmin._id.toString())).resolves.not.toThrowError()
            targetAdmin = await AdminModel.findByIdCached(targetAdmin._id.toString())
            expect(targetAdmin.approved).toBeFalsy()
        })
    })

    describe('list 메소드에서', () => {
        it('항상 성공한다', async () => {
            await expect(
                sut.list({
                    page: 1,
                    size: 10,
                    sort: AdminSortType.Newest,
                    getSort: jest.fn(),
                }),
            ).resolves.not.toThrowError()
        })
    })

    describe('logout 메소드에서', () => {
        it('항상 성공한다', async () => {
            sut.logout('whatever')
            expect(checkTokenIsRevoked('whatever')).toBeTruthy()
        })
    })
})
