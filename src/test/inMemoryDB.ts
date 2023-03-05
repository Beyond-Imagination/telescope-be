import { DB_NAME } from '@config'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let memoryServer

export class InMemoryDB {
    static connect = async () => {
        memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
        await mongoose.connect(memoryServer.getUri(), { dbName: DB_NAME })
    }

    static closeDatabase = async () => {
        await mongoose.connection.dropDatabase()
        await mongoose.connection.close()
        await memoryServer.stop()
    }

    static clearDatabase = async () => {
        const collections = mongoose.connection.collections

        for (const key in collections) {
            const collection = collections[key]
            await collection.deleteMany({})
        }
    }
}
