// Типы для roles.json
export interface Roles {
    admins: string[]
    moderators: string[]
}

// Тип роли пользователя
export type UserRole = 'admin' | 'moderator' | 'guest'
