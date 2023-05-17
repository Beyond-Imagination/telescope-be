import { Point } from '@models/organization'

export class AchievementCount {
    createIssue = 0
    resolveIssue = 0
    createCodeReview = 0
    mergeMr = 0
    receiveStar = 0
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
        this.total = this.createIssue + this.resolveIssue + this.createCodeReview + this.mergeMr + this.receiveStar
    }
}
