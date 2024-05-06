import { NextFunction, Request, Response } from 'express'
import { space } from '@/types/space.type'

// @See Also:
// https://www.jetbrains.com/help/space/add-webhooks.html#messagepayload-payload-contents
type OutBoundInfo = {
    url: string
    method: string
}

// webhook controller에 정의된 경로로 매핑
// key값은 Webhooks Model에 정의된 이름과 동기화 되어야한다.
const classNameMapper = new Map<String, OutBoundInfo>([
    [space.className.INSTALL, { url: '/space/install', method: 'POST' }],
    [space.className.UNINSTALL, { url: '/space/uninstall', method: 'POST' }],
    [space.className.CHANGE_URL, { url: '/space/changeURL', method: 'POST' }],
    [space.className.LIST_COMMAND, { url: '/space/list-command', method: 'GET' }],
    [space.className.MESSAGE, { url: '/space/message', method: 'POST' }],
])

export const classNameRouter = (req: Request, res: Response, next: NextFunction) => {
    const className = req.body.className
    if (className && classNameMapper.has(className)) {
        const { url, method } = classNameMapper.get(className)
        req.url = url
        req.method = method
    }
    next()
}
