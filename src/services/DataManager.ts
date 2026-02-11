import { Octokit } from '@octokit/rest'
import type { Roles } from '../types/roles'

export class DataManager {
    private octokit: Octokit
    private owner: string
    private repo: string
    private readonly ROLES_PATH = 'data/roles.json'

    constructor(token: string | null, owner: string, repo: string) {
        this.octokit = new Octokit({ auth: token })
        this.owner = owner
        this.repo = repo
    }

    async getRoles(): Promise<Roles> {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: this.ROLES_PATH,
            })

            if ('content' in data) {
                const content = atob(data.content)
                return JSON.parse(content)
            }
            return { admins: [], moderators: [] }
        } catch (error) {
            console.error('Error fetching roles:', error)
            return { admins: [], moderators: [] }
        }
    }

    async updateRoles(roles: Roles): Promise<void> {
        try {
            // Get current SHA
            const { data: currentFile } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: this.ROLES_PATH,
            })

            const sha = 'sha' in currentFile ? currentFile.sha : undefined

            await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path: this.ROLES_PATH,
                message: 'chore: Update roles',
                content: btoa(JSON.stringify(roles, null, 2)),
                sha,
            })
        } catch (error) {
            console.error('Error updating roles:', error)
            throw error
        }
    }
}
