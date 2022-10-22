import App from '@/app'
import { IndexController } from '@controllers/index.controller'
import { WebhooksController } from '@controllers/webhooks.controller'
import { OrganizationController } from '@controllers/organization.controller'
import validateEnv from '@utils/validateEnv'
;(async function () {
    validateEnv()
    const app = new App([IndexController, WebhooksController, OrganizationController])
    await app.connectDB()
    app.listen()
})()
