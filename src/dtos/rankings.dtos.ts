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

export class MonthStarryPeopleDto {
    year: number
    month: number
    id: string
    name: string
    score: number
    profilePicture: string | null

    constructor(date, id, name, score, profilePicture) {
        this.year = date.year
        this.month = date.month
        this.id = id
        this.name = name
        this.score = score
        this.profilePicture = profilePicture
    }
}
