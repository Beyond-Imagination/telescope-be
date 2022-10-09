import { modelOptions } from '@typegoose/typegoose'
import { Expose, Transform } from 'class-transformer'

@modelOptions({
    schemaOptions: {
        timestamps: true,
    },
})
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
