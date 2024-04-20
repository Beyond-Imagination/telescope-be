import { config } from 'dotenv'

import { logger } from '@/utils/logger'
import { SpaceClient } from '@/client/space.client'
;(async () => {
    const client = SpaceClient.getInstance()
    try {
        config()

        const token = process.env.SPACE_AUTOMATION_AUTHORIZATION
        const projectId = process.env.PROJECT_ID
        const reviewId = process.env.REVIEW_ID
        const serverURL = 'https://beyond-imagination.jetbrains.space'

        const team = await client.getTeam(token, serverURL)
        for (const membership of team.memberships) {
            // 스페이스에 동일한 db update 쿼리를 동시에 날리면 너무 많은 시간이 소요됨. 순차적으로 요청
            await client.addReviewParticipant(token, serverURL, projectId, reviewId, membership.member.id)
        }
    } catch (e) {
        logger.error('fail to add reviewer', e)
        throw e
    }
})()
