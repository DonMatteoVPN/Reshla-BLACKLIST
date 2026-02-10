import { useState, useEffect } from 'react'
import { DataManager } from '../services/DataManager'
import type { Profile } from '../types/profile'

/**
 * Хук для работы с данными чёрного списка
 */
export const useBlacklist = (
    token: string | null,
    owner: string,
    repo: string
) => {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            setIsLoading(false)
            return
        }

        const fetchProfiles = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const dataManager = new DataManager(token, owner, repo)
                const data = await dataManager.getBlacklistProfiles()
                setProfiles(data)
            } catch (err) {
                console.error('Error fetching blacklist:', err)
                setError('Ошибка загрузки данных')
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfiles()
    }, [token, owner, repo])

    /**
     * Обновить список профилей
     */
    const refresh = async () => {
        if (!token) return

        setIsLoading(true)
        try {
            const dataManager = new DataManager(token, owner, repo)
            const data = await dataManager.getBlacklistProfiles()
            setProfiles(data)
        } catch (err) {
            console.error('Error refreshing blacklist:', err)
            setError('Ошибка обновления данных')
        } finally {
            setIsLoading(false)
        }
    }

    return {
        profiles,
        isLoading,
        error,
        refresh,
    }
}
