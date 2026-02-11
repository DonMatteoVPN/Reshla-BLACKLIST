export type ReportStatus = 'voting' | 'moderation' | 'approved' | 'rejected'

export interface Report {
    id: number
    telegram_id: string
    username: string
    reason: string
    status: ReportStatus
    created_at: string
    vote_count: number
    voting_deadline: string
}

export interface ReportWithProofs extends Report {
    proofs: string[]
    comments: Comment[]
}

export interface Comment {
    id: number
    user: {
        login: string
        avatar_url: string
    }
    body: string
    created_at: string
}
