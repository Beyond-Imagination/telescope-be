import { Controller, Get } from 'routing-controllers'

@Controller('/api/team')
export class TeamController {
    @Get('/score')
    score() {
        return { score: 0 }
    }

    @Get('/rankings')
    rankings() {
        return { rankings: [] }
    }
}
