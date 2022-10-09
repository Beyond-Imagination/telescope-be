import { IsNotEmpty } from 'class-validator'

export class InstallDTO {
    @IsNotEmpty()
    className: string

    @IsNotEmpty()
    clientSecret: string

    @IsNotEmpty()
    serverUrl: string

    state: string

    @IsNotEmpty()
    clientId: string

    @IsNotEmpty()
    userId: string
}
