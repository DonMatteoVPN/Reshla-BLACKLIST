import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

interface LoginFormProps {
    onClose: () => void
}

const LoginForm = ({ onClose }: LoginFormProps) => {
    const { t } = useTranslation()
    const { login } = useAuth()
    const [token, setToken] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await login(token)
            onClose()
        } catch (err) {
            setError(t('auth.loginError'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="glass-effect rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">{t('auth.login')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('auth.enterToken')}
                        </label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder={t('auth.tokenPlaceholder')}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-danger text-sm">{error}</div>
                    )}

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 rounded bg-primary hover:bg-primary-dark disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? t('common.loading') : t('auth.login')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>

                <p className="text-xs text-dark-muted mt-4">
                    Получить Personal Access Token можно в настройках GitHub: Settings → Developer settings → Personal access tokens
                </p>
            </div>
        </div>
    )
}

export default LoginForm
