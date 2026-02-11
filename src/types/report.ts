export type ReportStatus = 'voting' | 'moderation' | 'approved' | 'rejected'

export interface Report {
    id: number // Issue Number
    telegram_id: string
    username: string
    reason: string
    status: ReportStatus
    vote_count: number
    submitted_by: string
    github_folder_path?: string
    created_at: string
    updated_at: string
    voting_deadline: string
    proof_images: string[] // URLs extracted from body
    html_url: string
}

export interface ReportProof {
    id: string
    report_id: string
    file_name: string
    file_url: string
    uploaded_at: string
}

// Vote is now just a reaction, we don't track UserID -> VoteID relation in DB anymore
// But we might want to check if current user voted (via API)
export interface Vote {
    user_id: string
    created_at: string
}

export interface ModeratorAction {
    id: string
    report_id: string
    moderator_id: string
    action: 'approve' | 'reject'
    comment?: string
    created_at: string
}

export interface ReportWithProofs extends Report {
    proofs: ReportProof[]
    moderator_actions: ModeratorAction[]
    user_voted?: boolean
}
