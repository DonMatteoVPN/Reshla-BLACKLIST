import { createContext, useContext, ReactNode, useMemo } from 'react'
import { useGitHubAuth } from '../hooks/useGitHubAuth'
import { useRoles } from '../hooks/useRoles'
import type { UserRole } from '../types/roles'
import { GitHubIssuesService } from '../services/GitHubIssuesService'

// Configuration
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'DonMatteoVPN'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'Reshla-BLACKLIST'

interface User {
    username: string
    avatar: string
    name: string
}

interface AuthContextType {
    token: string | null
    user: User | null
    isAuthenticated: boolean
    login: (token: string) => Promise<void>
    logout: () => void

    // Roles
    userRole: UserRole | null
    isAdmin: boolean
    isModerator: boolean
    isGuest: boolean

    // State
    isLoading: boolean
    error: string | null

    // Config
    owner: string
    repo: string

    // Services
    issuesService: GitHubIssuesService | null
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

    // Initialize Service
    const issuesService = useMemo(() => {
        return token ? new GitHubIssuesService(token, GITHUB_OWNER, GITHUB_REPO) : null
    }, [token])

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
        issuesService
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
