import { OrganizationModel } from '@models/organization'
import { setTestDB, testAdmin, testClientId, testClientSecret, testSpaceURL } from '@/test/test.util'
import { OrganizationNotFoundException } from '@exceptions/OrganizationNotFoundException'

describe('Organization 클래스', () => {
    setTestDB(async () => await OrganizationModel.saveOrganization(testClientId, testClientSecret, testSpaceURL, testAdmin, null))

    describe('saveOrganization 메소드에서', () => {
        it('항상 성공한다', async () => {
            await expect(
                OrganizationModel.saveOrganization('testClientId2', testClientSecret, 'https://test2.jetbrains.space', testAdmin, null),
            ).resolves.not.toThrow()
        })
    })

    describe('findByServerUrl 메소드에서', () => {
        it('존재하지 않는 ServerUrl 검색하면 에러가 발생한다', async () => {
            await expect(OrganizationModel.findByServerUrl('not.exist.server.com')).rejects.toThrowError(OrganizationNotFoundException)
        })

        it('존재하는 ServerUrl 검색하면 성공한다', async () => {
            await expect(OrganizationModel.findByServerUrl(testSpaceURL)).resolves.not.toThrow()
        })
    })

    describe('findByClientId 메소드에서', () => {
        it('존재하지 않는 ClientId 검색하면 에러가 발생한다', async () => {
            await expect(OrganizationModel.findByClientId('notExistClientId')).rejects.toThrowError(OrganizationNotFoundException)
        })

        it('존재하는 ClientId 검색하면 성공한다', async () => {
            await expect(OrganizationModel.findByClientId(testClientId)).resolves.not.toThrow()
        })
    })

    describe('deleteAllByClientId 메소드에서', () => {
        it('항상 성공한다', async () => {
            // 삭제 하기 이전에는 조회가 성공해야한다.
            await expect(OrganizationModel.findByClientId(testClientId)).resolves.not.toThrow()

            await expect(OrganizationModel.deleteAllByClientId(testClientId, null)).resolves.not.toThrow()

            //삭제한 이후에 조회하면 에러가 발생해야 한다.
            await expect(OrganizationModel.findByClientId('notExistClientId')).rejects.toThrowError(OrganizationNotFoundException)
        })
    })
})
