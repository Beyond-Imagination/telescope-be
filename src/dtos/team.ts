export interface Team {
    id: string
    name: string
    memberships: [Membership]
}

interface Membership {
    member: Member
}

interface Member {
    id: string
    username: string
}
