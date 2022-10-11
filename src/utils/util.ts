import { startSession } from 'mongoose'

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

// DB 트랜잭션을 걸어주는 데코레이터
export function Transactional() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value
        descriptor.value = async function (...args) {
            const session = await startSession()
            try {
                session.startTransaction()
                const result = method.apply(this, args)
                await session.commitTransaction()
                await session.endSession()
                return result
            } catch (error) {
                await session.abortTransaction()
                await session.endSession()
                throw error
            }
        }
    }
}
