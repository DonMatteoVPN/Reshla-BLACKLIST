// Типы для profile.json
export interface Profile {
    telegram_id: string
    username: string
    reason: string
    date: string // ISO 8601 format
    voting_count: number
    status: 'active' | 'pending'
    added_by?: string
    proof_files?: string[]
}

// Тип для отображения профиля с дополнительными данными
export interface ProfileWithProofs extends Profile {
    proofUrls: string[] // URL-ы изображений доказательств
}
