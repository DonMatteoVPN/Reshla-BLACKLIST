export type ReportStatus = 'voting' | 'pending_review' | 'approved' | 'rejected'

export interface Report {
    id: string
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
}

export interface ReportProof {
    id: string
    report_id: string
    file_name: string
    file_url: string
    uploaded_at: string
}

export interface Vote {
    id: string
    report_id: string
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
