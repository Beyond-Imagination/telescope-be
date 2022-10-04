import { Expose, Transform } from 'class-transformer'

export class Document {
    @Expose()
    @Transform(value => {
        if ('value' in value) {
            return value.obj[value.key].toString()
        }

        return 'unknown value'
    })
    public _id: string

    @Expose()
    public __v: number
}
