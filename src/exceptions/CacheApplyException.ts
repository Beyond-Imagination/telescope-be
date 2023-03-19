export class CacheApplyException extends Error {
    constructor() {
        super('Async가 아닌 함수는 캐싱할 수 없습니다.')
        Object.setPrototypeOf(this, CacheApplyException.prototype)
        Error.captureStackTrace(this, CacheApplyException)
    }
}
