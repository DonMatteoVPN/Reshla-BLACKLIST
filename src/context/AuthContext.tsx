import { createContext, useContext, ReactNode } from 'react'
import { useGitHubAuth } from '../hooks/useGitHubAuth'
import { useRoles } from '../hooks/useRoles'
import type { UserRole } from '../types/roles'

// Конфигурация репозитория (можно вынести в .env)
const GITHUB_OWNER = 'DonMatteoVPN' // TODO: Заменить на реальное значение
const GITHUB_REPO = 'Reshla-BLACKLIST' // TODO: Заменить на реальное значение

interface User {
    username: string
    avatar: string
    name: string
}

interface AuthContextType {
    // Аутентификация
    token: string | null
    user: User | null
    isAuthenticated: boolean
    login: (token: string) => Promise<void>
    logout: () => void

    // Роли
    userRole: UserRole
    isAdmin: boolean
    isModerator: boolean
    isGuest: boolean

    // Состояние загрузки
    isLoading: boolean
    error: string | null

    // Конфигурация репозитория
    owner: string
    repo: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { token, user, isLoading: authLoading, error, isAuthenticated, login, logout } = useGitHubAuth()
    const { userRole, isAdmin, isModerator, isGuest, isLoading: rolesLoading } = useRoles(
        token,
        user?.username || null,
        GITHUB_OWNER,
        GITHUB_REPO
    )

    const value: AuthContextType = {
        token,
        user,
        isAuthenticated,
        login,
        logout,
        userRole,
        isAdmin,
        isModerator,
        isGuest,
        isLoading: authLoading || rolesLoading,
        error,
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
