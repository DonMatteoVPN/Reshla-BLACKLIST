import { useState, useEffect } from 'react'
import { GitHubAPI } from '../services/GitHubAPI'

interface User {
    username: string
    avatar: string
    name: string
}

/**
 * Хук для работы с GitHub аутентификацией
 */
export const useGitHubAuth = () => {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // При загрузке проверяем наличие токена в localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('github_token')
        if (savedToken) {
            validateAndSetToken(savedToken)
        } else {
            setIsLoading(false)
        }
    }, [])

    /**
     * Валидация и установка токена
     */
    const validateAndSetToken = async (newToken: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const api = new GitHubAPI(newToken)
            const isValid = await api.validateToken()

            if (isValid) {
                const userData = await api.getCurrentUser()
                setToken(newToken)
                setUser(userData)
                localStorage.setItem('github_token', newToken)
            } else {
                throw new Error('Invalid token')
            }
        } catch (err) {
            setError('Ошибка валидации токена')
            setToken(null)
            setUser(null)
            localStorage.removeItem('github_token')
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Вход (сохранение токена)
     */
    const login = async (newToken: string) => {
        await validateAndSetToken(newToken)
    }

    /**
     * Выход (удаление токена)
     */
    const logout = () => {
        setToken(null)
        setUser(null)
        setError(null)
        localStorage.removeItem('github_token')
    }

    return {
        token,
        user,
        isLoading,
        error,
        isAuthenticated: !!token && !!user,
        login,
        logout,
    }
}
