import { Octokit } from '@octokit/rest'

/**
 * Обёртка над Octokit для упрощения работы с GitHub API
 */
export class GitHubAPI {
    private octokit: Octokit

    constructor(token: string) {
        this.octokit = new Octokit({ auth: token })
    }

    /**
     * Получить информацию о текущем пользователе
     */
    async getCurrentUser() {
        try {
            const { data } = await this.octokit.rest.users.getAuthenticated()
            return {
                username: data.login,
                avatar: data.avatar_url,
                name: data.name || data.login,
            }
        } catch (error) {
            console.error('Error getting current user:', error)
            throw error
        }
    }

    /**
     * Проверить валидность токена
     */
    async validateToken(): Promise<boolean> {
        try {
            await this.getCurrentUser()
            return true
        } catch {
            return false
        }
    }
}
