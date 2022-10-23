import { ScoreDtos } from '@dtos/score.dtos'

export class RankingsDtos {
    id: string
    name: string
    from: Date
    to: Date
    score: ScoreDtos[]

    constructor(id, name, from, to, score) {
        this.id = id
        this.name = name
        this.from = from
        this.to = to
        this.score = score
    }
}
