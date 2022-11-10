import { ScoreDtos } from '@dtos/score.dtos'

export class RankingsDtos {
    id: string
    name: string
    profilePicture: string | null
    score: ScoreDtos

    constructor(id, name, score, profilePicture) {
        this.id = id
        this.name = name
        this.profilePicture = profilePicture
        this.score = score
    }
}
