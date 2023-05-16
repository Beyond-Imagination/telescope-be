import { getTestAxiosOption, mockingAxios, mockOrganization, setTestDB, testClientId, testMessageId, testUserId } from '@/test/test.util'
import { StarService } from '@services/star.service'
import { Achievement } from '@models/achievement'
import { OrganizationModel } from '@models/organization'

describe('StarService 클래스', () => {
    const sut = StarService.getInstance()
    const starGiver = 'starGiver'
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    mockingAxios()

    setTestDB(async () => {
        await new OrganizationModel(mockOrganization).save()
    })

    const testAuthor = {
        details: {
            user: {
                id: testUserId,
            },
        },
    }

    describe('addPointToAuthor 메소드에서', () => {
        it('스스에게 별을 보내면 점수가 추가되지 않는다', async () => {
            await sut.addPointToAuthor(testClientId, testUserId, testMessageId, testAuthor, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(0)
        })

        it('유저가 누른 리액션이 아니면 점수가 추가되지 않는다', async () => {
            await sut.addPointToAuthor(testClientId, null, testMessageId, testAuthor, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(0)
        })

        it('같은 글에 별을 줘도 점수가 추가되지 않는다', async () => {
            await sut.addPointToAuthor(testClientId, starGiver, testMessageId, testAuthor, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(1)
            await sut.addPointToAuthor(testClientId, starGiver, testMessageId, testAuthor, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(1)
        })

        it('하루에 가능한 별을 이미 다 보냈다면 점수가 추가되지 않는다', async () => {
            for (let i = 0; i < 5; i++) {
                await sut.addPointToAuthor(testClientId, starGiver, i.toString(), testAuthor, getTestAxiosOption())
            }
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(5)

            await sut.addPointToAuthor(testClientId, starGiver, testMessageId, testAuthor, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(5)
        })

        it('정상적으로 별을 보내면 점수가 추가된다', async () => {
            await sut.addPointToAuthor(testClientId, starGiver, testMessageId, testAuthor, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(1)
        })
    })

    describe('deleteStar 메소드에서', () => {
        it('점수가 없는 글을 리액션을 취소해도 에러가 발생하지 않는다', async () => {
            await expect(sut.deletePoint(testClientId, testMessageId, testUserId, getTestAxiosOption())).resolves.not.toThrow()
        })

        it('유저가 누른 리액션이 아니면 취소해도 점수 삭제를 시도하지 않는다', async () => {
            const original = Achievement.deleteStar
            const mockFunction = jest.fn()
            Achievement.deleteStar = mockFunction
            await expect(sut.deletePoint(testClientId, testMessageId, null, getTestAxiosOption())).resolves.not.toThrow()
            await expect(mockFunction).toHaveBeenCalledTimes(0)
            Achievement.deleteStar = original // 다시 원복을 해놔야 다른 테스트에 영향을 끼치지 않는다
        })

        it('정상적으로 별을 취소하면 점수가 줄어든다', async () => {
            await sut.addPointToAuthor(testClientId, starGiver, testMessageId, testAuthor, getTestAxiosOption())
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(1)
            await expect(sut.deletePoint(testClientId, testMessageId, starGiver, getTestAxiosOption())).resolves.not.toThrow()
            await expect(Achievement.getStarCountByUserId(testClientId, startOfDay, new Date(), testUserId)).resolves.toBe(0)
        })
    })
})
