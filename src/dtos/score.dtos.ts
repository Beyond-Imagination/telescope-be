export class ScoreDtos {
    total: number
    createIssue: number
    resolveIssue: number
    createCodeReview: number
    mergeMr: number

    constructor(total = 0, create_issue = 0, resolve_issue = 0, create_code_review = 0, merge_mr = 0) {
        this.total = total
        this.createIssue = create_issue
        this.resolveIssue = resolve_issue
        this.createCodeReview = create_code_review
        this.mergeMr = merge_mr
    }
}
