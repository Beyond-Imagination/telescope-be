import { Cached, clearCache, deleteCache, getCachedValue, setCachedValue } from '@utils/cache.util'
import { sleep } from '@utils/util'
import { CacheApplyException } from '@exceptions/CacheApplyException'

const keyByKeyParams = '_hello_world'
const keyByKeyGenerator = 'world_hello'
const keyByDefaultStrategy = '_hello_world_!'
const returnValue = 'something'

const testKeyParams = ['$[0]', '$[1]']

function testKeyGenerator(args) {
    return args[1] + '_' + args[0]
}

class TestClass {
    @Cached({
        keyParams: testKeyParams,
        keyGenerator: testKeyGenerator,
    })
    static async both(p1, p2, p3) {
        return returnValue
    }

    @Cached({ keyParams: testKeyParams })
    static async onlyKeyParams(p1, p2, p3) {
        return returnValue
    }

    @Cached({ keyGenerator: testKeyGenerator })
    static async onlyKeyGenerator(p1, p2, p3) {
        return returnValue
    }

    @Cached({ ttl: 1000 })
    static async notSpecified(p1, p2, p3) {
        return returnValue
    }

    @Cached({})
    static async throwError(p1, p2, p3) {
        throw new Error()
    }

    static async addCacheOnSyncFunc() {
        // 일반 함수에 바로 Cached를 붙히면 요 파일이 자체가 테스트가 안돼서 어쩔수 없이 함수 실행시 동적으로 클래스가 생성되도록 했습니다.
        class Temp {
            @Cached({})
            static notAsyncFunc() {
                return returnValue
            }
        }
    }
}

describe('Cache.util.ts파일', () => {
    beforeEach(() => {
        clearCache()
    })

    describe('@Cached데코레이터에서', () => {
        it('keyParams와 keyGenerator가 둘다 있으면 keyParams의 키를 캐시키로 사용한다', async () => {
            expect(getCachedValue(keyByKeyParams)).toBe(undefined)
            expect(getCachedValue(keyByKeyGenerator)).toBe(undefined)
            await TestClass.both('hello', 'world', '!')
            expect(getCachedValue(keyByKeyParams)).toBe(returnValue)
            expect(getCachedValue(keyByKeyGenerator)).toBe(undefined)
        })

        it('keyParams를 정의하면 keyParams의 키를 캐시키로 사용한다', async () => {
            expect(getCachedValue(keyByKeyParams)).toBe(undefined)
            await TestClass.onlyKeyParams('hello', 'world', '!')
            expect(getCachedValue(keyByKeyParams)).toBe(returnValue)
        })

        it('keyGenerator를 정의하면 keyGenerator의 키를 캐시키로 사용한다', async () => {
            expect(getCachedValue(keyByKeyGenerator)).toBe(undefined)
            await TestClass.onlyKeyGenerator('hello', 'world', '!')
            expect(getCachedValue(keyByKeyGenerator)).toBe(returnValue)
        })

        it('정의된 키 생성 로직이 없으면 모든 파라메터를 캐시키로 사용한다', async () => {
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
            await TestClass.notSpecified('hello', 'world', '!')
            expect(getCachedValue(keyByDefaultStrategy)).toBe(returnValue)
        })

        it('ttl을 정의하면 자동으로 삭제된다', async () => {
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
            await TestClass.notSpecified('hello', 'world', '!')
            expect(getCachedValue(keyByDefaultStrategy)).toBe(returnValue)
            await sleep(1000)
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
        })

        it('async가 아닌 함수는 캐싱을 적용할수 없다', async () => {
            await expect(TestClass.addCacheOnSyncFunc()).rejects.toThrowError(CacheApplyException)
        })

        it('에러가 발생되면 캐싱이 되지않는다.', async () => {
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
            await expect(TestClass.throwError('hello', 'world', '!')).rejects.toThrowError(Error)
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
        })
    })

    describe('deleteCache함수에서', () => {
        it('호출하면 바로 삭제된다', async () => {
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
            await TestClass.notSpecified('hello', 'world', '!')
            expect(getCachedValue(keyByDefaultStrategy)).toBe(returnValue)
            deleteCache(keyByDefaultStrategy)
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
        })
    })

    describe('setCachedValue함수에서', () => {
        it('호출하면 캐시가 쓰여진다', async () => {
            expect(getCachedValue(keyByDefaultStrategy)).toBe(undefined)
            setCachedValue(keyByDefaultStrategy, returnValue)
            expect(getCachedValue(keyByDefaultStrategy)).toBe(returnValue)
        })
    })
})
