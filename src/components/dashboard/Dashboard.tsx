import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useBlacklist } from '../../hooks/useBlacklist'
import UserCard from './UserCard'
import FilterBar from './FilterBar'
import ReportUserModal from '../modals/ReportUserModal'

const Dashboard = () => {
    const { t } = useTranslation()
    const { token, owner, repo } = useAuth()
    const { profiles, isLoading, error } = useBlacklist(token, owner, repo)

    const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showReportModal, setShowReportModal] = useState(false)

    // Фильтрация профилей
    const filteredProfiles = profiles.filter((profile) => {
        // Фильтр по статусу
        if (filter === 'active' && profile.status !== 'active') return false
        if (filter === 'pending' && profile.status !== 'pending') return false

        // Поиск по Telegram ID
        if (searchQuery && !profile.telegram_id.includes(searchQuery)) return false

        return true
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-dark-muted">{t('common.loading')}</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-danger">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопка репорта */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-2 rounded bg-warning hover:bg-warning-dark transition-colors"
                >
                    {t('dashboard.reportUser')}
                </button>
            </div>

            {/* Фильтры и поиск */}
            <FilterBar
                filter={filter}
                setFilter={setFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {/* Сетка карточек */}
            {filteredProfiles.length === 0 ? (
                <div className="text-center py-12 text-dark-muted">
                    {t('dashboard.noResults')}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfiles.map((profile) => (
                        <UserCard key={profile.telegram_id} profile={profile} />
                    ))}
                </div>
            )}

            {/* Модалка репорта */}
            {showReportModal && (
                <ReportUserModal onClose={() => setShowReportModal(false)} />
            )}
        </div>
    )
}

export default Dashboard
