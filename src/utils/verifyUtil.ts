import axios from 'axios'

export async function getBearerToken(url: string, clientId: string, clientSecret: string) {
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

export function getAxiosOption(bearerToken: string) {
    return {
        headers: {
            'content-type': 'application/json',
            Accept: 'application/json',
            Authorization: bearerToken,
        },
    }
}
