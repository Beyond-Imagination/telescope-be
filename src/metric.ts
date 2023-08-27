import newrelic from 'newrelic'
import schedule from 'node-schedule'

import { logger } from '@utils/logger'
import { OrganizationModel } from '@models/organization'
import { PM_ID } from '@config'

export default class Metric {
    public static run() {
        if (PM_ID === '0') {
            logger.info('recording metric')
            schedule.scheduleJob('0 0 * * *', async () => {
                try {
                    await this.organizationCount()
                } catch (e) {
                    logger.error('metric record fail', { error: e })
                }
            })
        }
    }

    private static async organizationCount() {
        const count = (await OrganizationModel.estimatedDocumentCount()) as number
        newrelic.recordMetric('organization/count', count)
    }
}
