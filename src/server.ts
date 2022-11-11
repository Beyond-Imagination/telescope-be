import App from '@/app'
import { IndexController } from '@controllers/index.controller'
import { WebhooksController } from '@controllers/webhooks.controller'
import { OrganizationController } from '@controllers/organization.controller'
import { UsersController } from '@controllers/users.controller'
import validateEnv from '@utils/validateEnv'
;(async function () {
    validateEnv()
    const app = new App([IndexController, WebhooksController, OrganizationController, UsersController])
    await app.connectDB()
    app.listen()
})()
