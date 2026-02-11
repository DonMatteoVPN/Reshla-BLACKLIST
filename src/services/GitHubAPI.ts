import { Octokit } from '@octokit/rest'

export class GitHubAPI {
    private octokit: Octokit

    constructor(token: string) {
        this.octokit = new Octokit({
            auth: token,
        })
    }

    async validateToken(): Promise<boolean> {
        try {
            const { data } = await this.octokit.rest.users.getAuthenticated()
            return !!data.login
        } catch (error) {
            console.error('Token validation failed:', error)
            return false
        }
    }

    async getCurrentUser() {
        try {
            const { data } = await this.octokit.rest.users.getAuthenticated()
            return {
                username: data.login,
                avatar: data.avatar_url,
                name: data.name || data.login,
            }
        } catch (error) {
            console.error('Error getting user:', error)
            throw error
        }
    }
}
