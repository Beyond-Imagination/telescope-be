import { setTestDB, testAdminEmail, testAdminHashedPassword, testAdminName, testAdminPassword } from '@/test/test.util'
import { AdminService } from '@services/admin.service'
import { AdminModel } from '@models/admin'
import { AdminExistException } from '@exceptions/AdminExistException'
import { AdminNotFoundException } from '@exceptions/AdminNotFoundException'
import { AdminNotApprovedException } from '@exceptions/AdminNotApprovedException'
import { AdminSortType } from '@dtos/admin.dtos'

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
})
