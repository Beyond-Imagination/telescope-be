import App from '@/app'
import { IndexController } from '@controllers/index.controller'
import validateEnv from '@utils/validateEnv'

validateEnv()

const app = new App([IndexController])
app.listen()
