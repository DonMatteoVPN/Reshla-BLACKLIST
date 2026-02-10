import { Octokit } from '@octokit/rest'
import type { Roles } from '../types/roles'
import type { Profile } from '../types/profile'

/**
 * Класс для работы с GitHub API через Octokit
 * Все операции чтения/записи выполняются через репозиторий GitHub
 */
export class DataManager {
    private octokit: Octokit
    private owner: string
    private repo: string

    constructor(token: string, owner: string, repo: string) {
        this.octokit = new Octokit({ auth: token })
        this.owner = owner
        this.repo = repo
    }

    /**
     * Получить содержимое файла из репозитория
     */
    private async getFileContent(path: string): Promise<string> {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path,
            })

            if ('content' in data) {
                return Buffer.from(data.content, 'base64').toString('utf-8')
            }
            throw new Error('File not found')
        } catch (error) {
            console.error(`Error getting file ${path}:`, error)
            throw error
        }
    }

    /**
     * Получить SHA файла (нужен для обновления)
     */
    private async getFileSha(path: string): Promise<string> {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path,
            })

            if ('sha' in data) {
                return data.sha
            }
            throw new Error('SHA not found')
        } catch (error) {
            console.error(`Error getting SHA for ${path}:`, error)
            throw error
        }
    }

    /**
     * Получить роли из /config/roles.json
     */
    async getRoles(): Promise<Roles> {
        const content = await this.getFileContent('config/roles.json')
        return JSON.parse(content) as Roles
    }

    /**
     * Обновить роли в /config/roles.json
     */
    async updateRoles(roles: Roles): Promise<void> {
        const path = 'config/roles.json'
        const sha = await this.getFileSha(path)
        const content = Buffer.from(JSON.stringify(roles, null, 2)).toString('base64')

        await this.octokit.rest.repos.createOrUpdateFileContents({
            owner: this.owner,
            repo: this.repo,
            path,
            message: 'Update roles configuration',
            content,
            sha,
        })
    }

    /**
     * Получить все профили из /data/blacklist/
     */
    async getBlacklistProfiles(): Promise<Profile[]> {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: 'data/blacklist',
            })

            if (!Array.isArray(data)) {
                return []
            }

            // Получаем все папки (каждая папка = telegram_id)
            const folders = data.filter((item) => item.type === 'dir')

            // Для каждой папки получаем profile.json
            const profiles = await Promise.all(
                folders.map(async (folder) => {
                    try {
                        const content = await this.getFileContent(
                            `data/blacklist/${folder.name}/profile.json`
                        )
                        return JSON.parse(content) as Profile
                    } catch {
                        return null
                    }
                })
            )

            return profiles.filter((p) => p !== null) as Profile[]
        } catch (error) {
            console.error('Error getting blacklist profiles:', error)
            return []
        }
    }

    /**
     * Получить конкретный профиль по telegram_id
     */
    async getProfile(telegramId: string): Promise<Profile | null> {
        try {
            const content = await this.getFileContent(
                `data/blacklist/${telegramId}/profile.json`
            )
            return JSON.parse(content) as Profile
        } catch {
            return null
        }
    }

    /**
     * Получить список файлов доказательств для пользователя
     */
    async getProofFiles(telegramId: string): Promise<string[]> {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: `data/blacklist/${telegramId}/proofs`,
            })

            if (!Array.isArray(data)) {
                return []
            }

            return data
                .filter((item) => item.type === 'file')
                .map((item) => item.download_url || '')
                .filter((url) => url !== '')
        } catch {
            return []
        }
    }

    /**
     * Создать Pull Request с новым профилем
     * (для репортов от обычных пользователей)
     */
    async createProfile(
        profile: Profile,
        proofFiles: File[]
    ): Promise<void> {
        // TODO: Реализовать создание PR с загрузкой файлов
        // Это сложная операция, требует создания ветки, коммитов и PR
        console.log('Creating profile PR:', profile, proofFiles)
        throw new Error('Not implemented yet')
    }

    /**
     * Одобрить профиль (изменить статус на "active")
     */
    async approveProfile(telegramId: string): Promise<void> {
        const profile = await this.getProfile(telegramId)
        if (!profile) {
            throw new Error('Profile not found')
        }

        profile.status = 'active'

        const path = `data/blacklist/${telegramId}/profile.json`
        const sha = await this.getFileSha(path)
        const content = Buffer.from(JSON.stringify(profile, null, 2)).toString('base64')

        await this.octokit.rest.repos.createOrUpdateFileContents({
            owner: this.owner,
            repo: this.repo,
            path,
            message: `Approve ban for ${telegramId}`,
            content,
            sha,
        })
    }

    /**
     * Отклонить профиль (удалить папку)
     */
    async rejectProfile(telegramId: string): Promise<void> {
        // TODO: Реализовать удаление папки
        // Требует удаления всех файлов в папке
        console.log('Rejecting profile:', telegramId)
        throw new Error('Not implemented yet')
    }
}
