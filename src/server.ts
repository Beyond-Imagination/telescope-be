import '@/config'
import App from '@/app'
import Metric from '@/metric'
import { IndexController } from '@controllers/index.controller'
import { WebhooksController } from '@controllers/webhooks.controller'
import { OrganizationController } from '@controllers/organization.controller'
import { UsersController } from '@controllers/users.controller'
import validateEnv from '@utils/validateEnv'
import { AdminController } from '@controllers/admin.controller'
;(async function () {
    validateEnv()
    const app = new App([AdminController, IndexController, WebhooksController, OrganizationController, UsersController])
    await app.connectDB()
    app.listen()
    Metric.run()
})()
