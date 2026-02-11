import React, { createContext, useContext, useState, useEffect } from 'react'
import { Octokit } from '@octokit/rest'
import { GitHubIssuesService } from '../services/GitHubIssuesService'
import { DataManager } from '../services/DataManager'

interface User {
    login: string
    avatar_url: string
    html_url: string
    name: string
    username: string
    avatar: string
}

interface AuthContextType {
    token: string | null
    user: User | null
    isAuthenticated: boolean
    login: (token: string) => Promise<void>
    logout: () => void
    owner: string
    repo: string
    isAdmin: boolean
    isModerator: boolean
    issuesService: GitHubIssuesService | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'DonMatteoVPN'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'Reshla-BLACKLIST'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('github_token'))
    const [user, setUser] = useState<User | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isModerator, setIsModerator] = useState(false)
    const [issuesService, setIssuesService] = useState<GitHubIssuesService | null>(null)

    useEffect(() => {
        if (token) {
            checkAuth(token)
        } else {
            // Initialize public read-only service
            setIssuesService(new GitHubIssuesService(null, GITHUB_OWNER, GITHUB_REPO))
        }
    }, [token])

    const checkAuth = async (accessToken: string) => {
        try {
            const octokit = new Octokit({ auth: accessToken })
            const { data } = await octokit.rest.users.getAuthenticated()
            
            const userData = {
                login: data.login,
                avatar_url: data.avatar_url,
                html_url: data.html_url,
                name: data.name || data.login,
                username: data.login,
                avatar: data.avatar_url
            }

            setUser(userData)
            setIssuesService(new GitHubIssuesService(accessToken, GITHUB_OWNER, GITHUB_REPO))

            // Check Roles
            const dataManager = new DataManager(accessToken, GITHUB_OWNER, GITHUB_REPO)
            const roles = await dataManager.getRoles()
            
            setIsAdmin(roles.admins.includes(userData.login))
            setIsModerator(roles.moderators.includes(userData.login) || roles.admins.includes(userData.login))

        } catch (error) {
            console.error('Auth verification failed:', error)
            logout()
        }
    }

    const login = async (accessToken: string) => {
        localStorage.setItem('github_token', accessToken)
        setToken(accessToken)
    }

    const logout = () => {
        localStorage.removeItem('github_token')
        setToken(null)
        setUser(null)
        setIsAdmin(false)
        setIsModerator(false)
        setIssuesService(new GitHubIssuesService(null, GITHUB_OWNER, GITHUB_REPO))
    }

    return (
        <AuthContext.Provider value={{
            token,
            user,
            isAuthenticated: !!user,
            login,
            logout,
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            isAdmin,
            isModerator,
            issuesService
        }}>
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
