import { ScoreDtos } from '@dtos/score.dtos'

export class RankingsDtos {
    id: string
    name: string
    score: ScoreDtos[]

    constructor(id, name, score) {
        this.id = id
        this.name = name
        this.score = score
    }
}
