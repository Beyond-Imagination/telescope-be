export class CodeLinesSummary {
    _id: {
        date: string
    }
    addedLines = 0
    deletedLines = 0
}

export class CodeLinesDtos extends CodeLinesSummary {
    total: number

    constructor(summary: CodeLinesSummary = new CodeLinesSummary()) {
        super()
        this.addedLines = summary.addedLines
        this.deletedLines = summary.deletedLines
        this.total = this.addedLines + this.deletedLines
    }
}
