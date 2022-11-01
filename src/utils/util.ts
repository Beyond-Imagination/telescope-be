import { ClientSession, startSession } from 'mongoose'

/**
 * @method isEmpty
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is Empty Check
 */
export const isEmpty = (value: string | number | object): boolean => {
    if (value === null) {
        return true
    } else if (typeof value !== 'number' && value === '') {
        return true
    } else if (typeof value === 'undefined' || value === undefined) {
        return true
    } else return value !== null && typeof value === 'object' && !Object.keys(value).length
}

// DB 트랜잭션을 걸어주는 핸들러
export const mongooseTransactionHandler = async <T = any>(method: (session: ClientSession) => Promise<T>): Promise<T> => {
    const session = await startSession()
    session.startTransaction()

    let error
    let result: T
    try {
        result = await method(session)
        await session.commitTransaction()
    } catch (err) {
        error = err
        await session.abortTransaction()
    } finally {
        await session.endSession()
    }
    if (error) {
        throw error
    }

    return result
}
