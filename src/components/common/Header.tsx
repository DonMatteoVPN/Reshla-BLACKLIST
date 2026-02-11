import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LoginForm from '../auth/LoginForm'

const Header = () => {
    const { t, i18n } = useTranslation()
    const { user, isAuthenticated, logout, isAdmin, isModerator } = useAuth()
    const [showLoginForm, setShowLoginForm] = useState(false)

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ru' ? 'en' : 'ru'
        i18n.changeLanguage(newLang)
    }

    return (
        <header className="glass-effect sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Лого */}
                    <Link to="/" className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold gradient-text">
                            {t('app.title')}
                        </h1>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-6 ml-8 mr-auto">
                        <Link to="/voting" className="text-dark-muted hover:text-accent transition-colors">
                            {t('votingHub.title')}
                        </Link>
                        {isModerator && (
                            <Link to="/moderation" className="text-dark-muted hover:text-primary transition-colors">
                                {t('moderationDashboard.title')}
                            </Link>
                        )}
                    </div>

                    {/* Навигация и действия */}
                    <div className="flex items-center space-x-4">
                        {/* Переключатель языка */}
                        <button
                            onClick={toggleLanguage}
                            className="px-3 py-1 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                        >
                            {i18n.language.toUpperCase()}
                        </button>

                        {/* Админ панель (только для админов) */}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors"
                            >
                                {t('admin.title')}
                            </Link>
                        )}

                        {/* Пользователь */}
                        {isAuthenticated && user ? (
                            <div className="flex items-center space-x-3">
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="text-dark-text">{user.username}</span>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 rounded bg-danger hover:bg-danger-dark transition-colors"
                                >
                                    {t('auth.logout')}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLoginForm(true)}
                                className="px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors"
                            >
                                {t('auth.login')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Модалка входа */}
            {showLoginForm && (
                <LoginForm onClose={() => setShowLoginForm(false)} />
            )}
        </header>
    )
}

export default Header
