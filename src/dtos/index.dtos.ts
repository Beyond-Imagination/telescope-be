import { IsNotEmpty } from 'class-validator'

export class InstallAndUninstallDTO {
    // 요 아래 IsNotEmpty()로 선언된 필드 3개는 두개의 웹훅이 공유하는 필드들

    @IsNotEmpty()
    className: string

    @IsNotEmpty()
    serverUrl: string

    @IsNotEmpty()
    clientId: string

    //요 아래 3개는 Install 웹훅에서만 사용하는 필드들

    clientSecret: string | undefined

    state: string | undefined

    userId: string | undefined
}

export class LogDto {
    logType: string
    clientId: string

    constructor(logType, clientId) {
        this.logType = logType
        this.clientId = clientId
    }
}

export class ChangeServerUrlDto {
    className: string
    newServerUrl: string
    clientId: string
    userId: string | undefined // 기본값: null
    verificationToken: string | undefined // 기본값: null
}
