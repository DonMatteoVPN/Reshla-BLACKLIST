import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { DataManager } from '../../services/DataManager'
import type { Profile } from '../../types/profile'

interface UserDetailsModalProps {
    profile: Profile
    onClose: () => void
}

const UserDetailsModal = ({ profile, onClose }: UserDetailsModalProps) => {
    const { t } = useTranslation()
    const { token, owner, repo, isModerator } = useAuth()
    const [proofUrls, setProofUrls] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Загрузка доказательств
    useEffect(() => {
        if (!token) return

        const loadProofs = async () => {
            try {
                const dataManager = new DataManager(token, owner, repo)
                const urls = await dataManager.getProofFiles(profile.telegram_id)
                setProofUrls(urls)
            } catch (error) {
                console.error('Error loading proofs:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadProofs()
    }, [token, owner, repo, profile.telegram_id])

    const handleApprove = async () => {
        if (!token) return

        try {
            const dataManager = new DataManager(token, owner, repo)
            await dataManager.approveProfile(profile.telegram_id)
            alert(t('common.success'))
            onClose()
        } catch (error) {
            console.error('Error approving profile:', error)
            alert(t('common.error'))
        }
    }

    const handleReject = async () => {
        if (!token || !confirm('Вы уверены?')) return

        try {
            const dataManager = new DataManager(token, owner, repo)
            await dataManager.rejectProfile(profile.telegram_id)
            alert(t('common.success'))
            onClose()
        } catch (error) {
            console.error('Error rejecting profile:', error)
            alert(t('common.error'))
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="glass-effect rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6">{t('userDetails.title')}</h2>

                {/* Информация о пользователе */}
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-dark-muted text-sm">{t('userCard.telegramId')}</p>
                            <p className="font-mono">{profile.telegram_id}</p>
                        </div>
                        <div>
                            <p className="text-dark-muted text-sm">{t('userCard.username')}</p>
                            <p>@{profile.username}</p>
                        </div>
                        <div>
                            <p className="text-dark-muted text-sm">{t('userCard.status')}</p>
                            <p>{profile.status === 'active' ? t('userCard.statusActive') : t('userCard.statusPending')}</p>
                        </div>
                        <div>
                            <p className="text-dark-muted text-sm">{t('userCard.date')}</p>
                            <p>{new Date(profile.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('userCard.reason')}</p>
                        <p>{profile.reason}</p>
                    </div>
                    {profile.added_by && (
                        <div>
                            <p className="text-dark-muted text-sm">{t('userDetails.addedBy')}</p>
                            <p>{profile.added_by}</p>
                        </div>
                    )}
                </div>

                {/* Доказательства */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{t('userDetails.proofs')}</h3>
                    {isLoading ? (
                        <p className="text-dark-muted">{t('common.loading')}</p>
                    ) : proofUrls.length === 0 ? (
                        <p className="text-dark-muted">{t('userDetails.noProofs')}</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {proofUrls.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`Proof ${index + 1}`}
                                    className="rounded border border-dark-border w-full h-48 object-cover"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Действия */}
                <div className="flex space-x-3">
                    {isModerator && profile.status === 'pending' && (
                        <>
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 rounded bg-success hover:bg-success-dark transition-colors"
                            >
                                {t('userCard.approve')}
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 rounded bg-danger hover:bg-danger-dark transition-colors"
                            >
                                {t('userCard.reject')}
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto px-4 py-2 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                    >
                        {t('userDetails.close')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UserDetailsModal
