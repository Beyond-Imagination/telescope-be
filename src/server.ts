import App from '@/app'
import { IndexController } from '@controllers/index.controller'
import { WebhooksController } from '@controllers/webhooks.controller'
import { TeamController } from '@controllers/team.controller'
import validateEnv from '@utils/validateEnv'

validateEnv()

const app = new App([IndexController, WebhooksController, TeamController])
app.listen()
