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
                // В браузере используем atob для декодирования base64
                // Для корректной поддержки UTF-8 используем decodeURIComponent + escape
                return decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))))
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
        const jsonContent = JSON.stringify(roles, null, 2)
        // В браузере используем btoa для кодирования в base64
        // Для корректной поддержки UTF-8 используем btoa + unescape + encodeURIComponent
        const content = btoa(unescape(encodeURIComponent(jsonContent)))

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
     * Преобразовать File в base64 строку
     */
    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const base64String = reader.result?.toString().split(',')[1]
                if (base64String) resolve(base64String)
                else reject(new Error('Failed to convert file to base64'))
            }
            reader.onerror = (error) => reject(error)
        })
    }

    /**
     * Создать Pull Request с новым профилем
     * (для репортов от обычных пользователей)
     */
    async createProfile(
        profile: Profile,
        proofFiles: File[]
    ): Promise<void> {
        try {
            const telegramId = profile.telegram_id

            // 1. Загружаем доказательства в основную ветку
            for (const file of proofFiles) {
                const content = await this.fileToBase64(file)
                await this.octokit.rest.repos.createOrUpdateFileContents({
                    owner: this.owner,
                    repo: this.repo,
                    path: `data/blacklist/${telegramId}/proofs/${file.name}`,
                    message: `Upload proof: ${file.name}`,
                    content
                })
            }

            // 2. Загружаем profile.json в основную ветку
            const jsonContent = JSON.stringify(profile, null, 2)
            const profileContent = btoa(unescape(encodeURIComponent(jsonContent)))

            // Проверяем, существует ли уже профиль (хотя для новых не должен)
            const sha = await this.getFileSha(`data/blacklist/${telegramId}/profile.json`)

            await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path: `data/blacklist/${telegramId}/profile.json`,
                message: `Create report for ${telegramId}`,
                content: profileContent,
                sha: sha || undefined
            })
        } catch (error) {
            console.error('Error creating profile:', error)
            throw error
        }
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
        profile.updated_at = new Date().toISOString()

        const path = `data/blacklist/${telegramId}/profile.json`
        const sha = await this.getFileSha(path)
        const jsonContent = JSON.stringify(profile, null, 2)
        const content = btoa(unescape(encodeURIComponent(jsonContent)))

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
     * Отклонить профиль (удалить папку пользователя)
     */
    async rejectProfile(telegramId: string): Promise<void> {
        try {
            const userPath = `data/blacklist/${telegramId}`

            // Получаем список всех файлов в папке рекурсивно
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: userPath,
            })

            if (!Array.isArray(data)) return

            // Удаляем каждый файл
            for (const item of data) {
                if (item.type === 'file') {
                    await this.octokit.rest.repos.deleteFile({
                        owner: this.owner,
                        repo: this.repo,
                        path: item.path,
                        message: `Remove file due to rejected report: ${item.name}`,
                        sha: item.sha,
                    })
                } else if (item.type === 'dir') {
                    // Рекурсивно для подпапок (например, proofs)
                    const { data: subData } = await this.octokit.rest.repos.getContent({
                        owner: this.owner,
                        repo: this.repo,
                        path: item.path,
                    })
                    if (Array.isArray(subData)) {
                        for (const subItem of subData) {
                            if (subItem.type === 'file') {
                                await this.octokit.rest.repos.deleteFile({
                                    owner: this.owner,
                                    repo: this.repo,
                                    path: subItem.path,
                                    message: `Remove proof: ${subItem.name}`,
                                    sha: subItem.sha,
                                })
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error rejecting profile:', error)
            throw error
        }
    }
}
