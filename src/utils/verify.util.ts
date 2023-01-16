import axios from 'axios'
import { Cached } from '@utils/cache.util'

// 데코레이터는 클래스 내부에서만 사용이 가능해서 요런식으로 export function을 클래스 내부로 가져왔습니다
class VerifyUtil {
    @Cached({ keyParams: ['$..*'], prefix: 'bearerToken' })
    async getBearerToken(url: string, clientId: string, clientSecret: string) {
        const fullUrl = url + '/oauth/token'
        const token = `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`
        const FormData = require('form-data')

        const form = new FormData()
        form.append('grant_type', 'client_credentials')
        form.append('scope', '**')

        const response = await axios.post(fullUrl, form, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: token,
            },
        })

        return `Bearer ${response.data.access_token}`
    }

    getAxiosOption(bearerToken: string) {
        return {
            headers: {
                'content-type': 'application/json',
                Accept: 'application/json',
                Authorization: bearerToken,
            },
        }
    }
}

const verifyUtil = new VerifyUtil()
export const getBearerToken = verifyUtil.getBearerToken
export const getAxiosOption = verifyUtil.getAxiosOption
