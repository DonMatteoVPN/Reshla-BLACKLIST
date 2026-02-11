import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LoginForm from '../auth/LoginForm'

const Header = () => {
    const { t, i18n } = useTranslation()
    const { isAuthenticated, user, userRole, logout, isModerator, isAdmin } = useAuth()
    const location = useLocation()
    const [showLogin, setShowLogin] = useState(false)

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru')
    }

    const isActive = (path: string) => location.pathname === path

    return (
        <header className="border-b border-dark-border bg-dark-surface/50 backdrop-blur-md sticky top-0 z-40">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                        R
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden sm:block">
                        Reshla <span className="text-primary">Blacklist</span>
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-1">
                    <Link
                        to="/"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')
                            ? 'bg-dark-border text-white'
                            : 'text-dark-muted hover:text-white hover:bg-dark-border/50'
                            }`}
                    >
                        {t('dashboard.title')}
                    </Link>
                    <Link
                        to="/voting"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/voting')
                            ? 'bg-dark-border text-warning'
                            : 'text-dark-muted hover:text-warning hover:bg-dark-border/50'
                            }`}
                    >
                        {t('votingHub.title')}
                    </Link>
                    {isModerator && (
                        <Link
                            to="/moderation"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/moderation')
                                ? 'bg-dark-border text-danger'
                                : 'text-dark-muted hover:text-danger hover:bg-dark-border/50'
                                }`}
                        >
                            {t('moderationDashboard.title')}
                        </Link>
                    )}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin')
                                ? 'bg-dark-border text-accent'
                                : 'text-dark-muted hover:text-accent hover:bg-dark-border/50'
                                }`}
                        >
                            {t('admin.title')}
                        </Link>
                    )}
                </nav>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleLanguage}
                        className="text-dark-muted hover:text-white transition-colors font-mono text-sm"
                    >
                        {i18n.language.toUpperCase()}
                    </button>

                    {isAuthenticated ? (
                        <div className="flex items-center space-x-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-white">
                                    {user?.name || user?.username}
                                </div>
                                <div className="text-xs text-dark-muted uppercase tracking-wider">
                                    {userRole}
                                </div>
                            </div>
                            <img
                                src={user?.avatar}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full border border-dark-border"
                            />
                            <button
                                onClick={logout}
                                className="text-dark-muted hover:text-danger transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowLogin(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-primary/20"
                        >
                            {t('auth.login')}
                        </button>
                    )}
                </div>
            </div>

            {/* Login Modal */}
            {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
        </header>
    )
}

export default Header
