import { Point } from '@models/organization'

export class AchievementCount {
    _id: {
        date: string
    }
    createIssue = 0
    resolveIssue = 0
    createCodeReview = 0
    mergeMr = 0
    receiveStar = 0
    codeReviewDiscussion = 0
    acceptCodeReview = 0
}

export class ScoreDtos extends AchievementCount {
    total: number

    constructor(point: Point, count: AchievementCount = new AchievementCount()) {
        super()
        this.createIssue = point.createIssue * count.createIssue
        this.resolveIssue = point.resolveIssue * count.resolveIssue
        this.createCodeReview = point.createCodeReview * count.createCodeReview
        this.mergeMr = point.mergeMr * count.mergeMr
        this.receiveStar = point.receiveStar * count.receiveStar
        this.codeReviewDiscussion = point.codeReviewDiscussion * count.codeReviewDiscussion
        this.acceptCodeReview = point.acceptCodeReview * count.acceptCodeReview
        this.total =
            this.createIssue +
            this.resolveIssue +
            this.createCodeReview +
            this.mergeMr +
            this.receiveStar +
            this.codeReviewDiscussion +
            this.acceptCodeReview
    }
}
