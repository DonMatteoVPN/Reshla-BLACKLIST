import { useState, useEffect } from 'react'
import { DataManager } from '../services/DataManager'
import type { Roles, UserRole } from '../types/roles'

/**
 * Хук для работы с ролями пользователей
 */
export const useRoles = (
    token: string | null,
    username: string | null,
    owner: string,
    repo: string
) => {
    const [roles, setRoles] = useState<Roles | null>(null)
    const [userRole, setUserRole] = useState<UserRole>('guest')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!token || !username) {
            setUserRole('guest')
            setIsLoading(false)
            return
        }

        const fetchRoles = async () => {
            try {
                const dataManager = new DataManager(token, owner, repo)
                const rolesData = await dataManager.getRoles()
                setRoles(rolesData)

                // Определяем роль пользователя
                if (rolesData.admins.includes(username)) {
                    setUserRole('admin')
                } else if (rolesData.moderators.includes(username)) {
                    setUserRole('moderator')
                } else {
                    setUserRole('guest')
                }
            } catch (error) {
                console.error('Error fetching roles:', error)
                setUserRole('guest')
            } finally {
                setIsLoading(false)
            }
        }

        fetchRoles()
    }, [token, username, owner, repo])

    return {
        roles,
        userRole,
        isLoading,
        isAdmin: userRole === 'admin',
        isModerator: userRole === 'moderator' || userRole === 'admin',
        isGuest: userRole === 'guest',
    }
}
