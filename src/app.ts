import 'reflect-metadata'
import { defaultMetadataStorage } from 'class-transformer/cjs/storage'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import { Action, getMetadataArgsStorage, useExpressServer } from 'routing-controllers'
import { routingControllersToSpec } from 'routing-controllers-openapi'
import swaggerUi from 'swagger-ui-express'
import { CREDENTIALS, NODE_ENV, ORIGIN, PORT, SECRET_KEY } from '@config'
import errorMiddleware from '@middlewares/error.middleware'
import { logger, loggerMiddleware } from '@utils/logger'
import dbConnector from '@models/connector'
import * as mongoose from 'mongoose'
import { AdminModel } from '@models/admin'
import { AdminDTO } from '@dtos/admin.dtos'
import jwt from 'jsonwebtoken'
import { checkTokenIsRevoked } from '@utils/cache.util'

class App {
    public app: express.Application
    public env: string
    public port: string | number

    constructor(Controllers: Function[]) {
        this.app = express()
        this.env = NODE_ENV || 'development'
        this.port = PORT || 3000

        this.initializeMiddlewares()
        this.initializeRoutes(Controllers)
        this.initializeSwagger(Controllers)
        this.initializeErrorHandling()
    }

    public async connectDB() {
        await dbConnector()
    }

    public listen() {
        const server = this.app.listen(this.port, () => {
            logger.info(`🚀 App listening on the port: ${this.port} ENV: ${this.env}`)
        })

        const gracefulShutdownHandler = function gracefulShutdownHandler() {
            console.log(`Gracefully shutting down`)

            setTimeout(() => {
                console.log('Shutting down application')
                server.close(async function () {
                    console.log('All requests stopped, shutting down')
                    await mongoose.connection.close(false)
                    process.exit()
                })
            }, 0)
        }

        process.on('SIGINT', gracefulShutdownHandler)
        process.on('SIGTERM', gracefulShutdownHandler)
    }

    public getServer() {
        return this.app
    }

    private initializeMiddlewares() {
        this.app.use(loggerMiddleware)
        this.app.use(hpp())
        this.app.use(helmet())
        this.app.use(compression())
        this.app.use(express.json())
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(cookieParser())
    }

    private initializeRoutes(controllers: Function[]) {
        useExpressServer(this.app, {
            cors: {
                origin: ORIGIN,
                credentials: CREDENTIALS,
            },
            controllers: controllers,
            defaultErrorHandler: false,
            authorizationChecker: async (action: Action) => {
                const authHeader = action.request.headers['authorization']
                const token = authHeader && authHeader.split(' ')[1]
                if (!token) {
                    return false
                }
                const user = jwt.verify(token, SECRET_KEY)
                if (checkTokenIsRevoked(user.jti)) {
                    return false
                }
                action.request.jti = user.jti

                const admin = await AdminModel.findByIdCached(user.id)
                if (!admin.approved) {
                    return false
                }
                action.request.user = new AdminDTO(admin)

                return true
            },
        })
    }

    private initializeSwagger(controllers: Function[]) {
        const schemas = validationMetadatasToSchemas({
            classTransformerMetadataStorage: defaultMetadataStorage,
            refPointerPrefix: '#/components/schemas/',
        })

        const routingControllersOptions = {
            controllers: controllers,
        }

        const storage = getMetadataArgsStorage()
        const spec = routingControllersToSpec(storage, routingControllersOptions, {
            components: {
                schemas,
                securitySchemes: {
                    basicAuth: {
                        scheme: 'basic',
                        type: 'http',
                    },
                },
            },
            info: {
                description: 'Generated with `routing-controllers-openapi`',
                title: 'A sample API',
                version: '1.0.0',
            },
        })

        this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec))
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware)
    }
}

export default App
