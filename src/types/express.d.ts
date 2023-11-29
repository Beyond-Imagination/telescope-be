import { Organization } from '@models/organization'

declare global {
    namespace Express {
        interface Request {
            user: any
            axiosOption: any
            jti: string
            _routeWhitelists: any
            _routeBlacklists: any
            organization: Organization
            fromDate: Date
            toDate: Date
        }

        interface Response {
            error: Error
        }
    }
}
