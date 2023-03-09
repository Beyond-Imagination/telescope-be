import LRUCache from 'lru-cache'
import jsonPath from 'jsonpath'

const cache: LRUCache<string, any> = new LRUCache<string, any>({
    // 10000개의 정보까진 캐싱해둔다
    max: 10000,

    allowStale: false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
})

const delimiter = '_'

/*
 * 요 데코레이터는 꼭 DB접근이나 API호출이 아니더라도 필요한곳 어디든지 사용가능합니다
 *
 * @parameter
 * keyParams : 캐시키로 사용될 파라메터들을 지정하는 리스트
 *             각 리스트 element들은 많은곳에서 사용하는 JsonPath 문법을 활용하여 지정할 수 있다.
 *             jsonPath.query의 결과값은 리스트이기 때문에 원한다면 한개의 파라메터가 아닌 리스트를 반환하는 jsonPath를 사용해도 된다. ex) $..something
 *             참고자료 -> https://github.com/dchester/jsonpath#readme
 * prefix : 캐시 키의 prefix
 * ttl : 캐시 만료 시간. 이 시간이 지나면 캐시에서 사라지고 다음 요청시에는 메소드가 실행됩니다.
 *       만료를 원치 않으면 { ttl: undefined }라고 하시면 됩니다.
 *       시간에 의한 만료는 없어져도 LRU의 특성상 자주 사용 안되는 정보는 캐시에서 사라집니다.
 *       기본값은 6시간입니다.
 */
export function Cached({ keyParams = null, keyGenerator = allArgsKeyGenerator, prefix = '', ttl = 1000 * 60 * 60 * 6 }) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value
        descriptor.value = function (...args) {
            let cacheKey = `${prefix}`
            // 함수의 모든 파라메터를 캐시를 위한 키로 사용한다
            if (keyParams) {
                keyParams.forEach(keyParam => jsonPath.query(args, keyParam).forEach(param => (cacheKey += delimiter + argToString(param))))
            } else {
                cacheKey += keyGenerator(args)
            }

            if (cache.has(cacheKey)) {
                return cache.get(cacheKey)
            }
            const result = method.apply(this, args)
            cache.set(cacheKey, result, { ttl: ttl })
            return result
        }
    }
}

function allArgsKeyGenerator(args) {
    let key = ''
    args.forEach(arg => (key += delimiter + argToString(arg)))
    return key
}

// 요 아래 함수들은 캐시에서 직접 값을 가져오거나 설정하고 싶을때 사용하세요
export function getCachedValue(key: string) {
    return cache.get(key)
}

export function setCachedValue(key: string, value: any) {
    cache.set(key, value)
}

export function deleteCache(key: string) {
    cache.delete(key)
}

export function clearCache() {
    cache.clear()
}

const tokenRevokeKey = 'REVOKED_TOKEN_'

export function revokeToken(token: string) {
    cache.set(tokenRevokeKey + token, true, { ttl: 1000 * 60 * 60 })
}

export function checkTokenIsRevoked(token) {
    return cache.get(tokenRevokeKey + token) ?? false
}

export async function deleteAllCacheByKeyPattern(pattern: RegExp) {
    const keys = cache.keys()

    let curr = keys.next()
    while (!curr.done) {
        const value = curr.value
        if (value.match(pattern)) {
            cache.delete(value)
        }
        curr = keys.next()
    }
}

function argToString(arg: any) {
    if (typeof arg === 'object') {
        return JSON.stringify(arg)
    } else {
        return String(arg)
    }
}
