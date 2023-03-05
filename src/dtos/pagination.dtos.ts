import { PaginateResult } from 'mongoose'

export class PageInfoDTO {
    totalDataCnt: number
    totalPages: number
    isLastPage: boolean
    isFirstPage: boolean
    requestPage: number
    requestSize: number

    constructor(paginated: PaginateResult<any>) {
        this.totalDataCnt = paginated.totalDocs
        this.totalPages = paginated.totalPages
        this.isLastPage = !paginated.hasNextPage
        this.isFirstPage = !paginated.hasPrevPage
        this.requestPage = paginated.page
        this.requestSize = paginated.limit
    }
}
