import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Profile } from '../../types/profile'
import UserDetailsModal from '../modals/UserDetailsModal'

interface UserCardProps {
    profile: Profile
}

const UserCard = ({ profile }: UserCardProps) => {
    const { t } = useTranslation()
    const [showDetails, setShowDetails] = useState(false)

    const statusColor = profile.status === 'active' ? 'bg-danger' : 'bg-warning'
    const statusText = profile.status === 'active'
        ? t('userCard.statusActive')
        : t('userCard.statusPending')

    return (
        <>
            <div
                onClick={() => setShowDetails(true)}
                className="glass-effect rounded-lg p-6 cursor-pointer hover:border-primary transition-all animate-fade-in"
            >
                {/* Статус */}
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded text-sm ${statusColor}`}>
                        {statusText}
                    </span>
                    {profile.status === 'pending' && (
                        <span className="text-dark-muted text-sm">
                            {profile.voting_count} {t('userCard.votes')}
                        </span>
                    )}
                </div>

                {/* Информация */}
                <div className="space-y-2">
                    <div>
                        <p className="text-dark-muted text-sm">{t('userCard.telegramId')}</p>
                        <p className="font-mono">{profile.telegram_id}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('userCard.username')}</p>
                        <p>@{profile.username}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('userCard.reason')}</p>
                        <p className="line-clamp-2">{profile.reason}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('userCard.date')}</p>
                        <p>{new Date(profile.date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Кнопка */}
                <button className="mt-4 w-full px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors">
                    {t('userCard.viewDetails')}
                </button>
            </div>

            {/* Модалка с деталями */}
            {showDetails && (
                <UserDetailsModal
                    profile={profile}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </>
    )
}

export default UserCard
