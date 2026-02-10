import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { DataManager } from '../../services/DataManager'
import type { Profile } from '../../types/profile'

interface ReportUserModalProps {
    onClose: () => void
}

const ReportUserModal = ({ onClose }: ReportUserModalProps) => {
    const { t } = useTranslation()
    const { token, owner, repo, user } = useAuth()
    const [telegramId, setTelegramId] = useState('')
    const [username, setUsername] = useState('')
    const [reason, setReason] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) {
            alert(t('auth.loginRequired'))
            return
        }

        setIsLoading(true)

        try {
            const dataManager = new DataManager(token, owner, repo)

            const profile: Profile = {
                telegram_id: telegramId,
                username: username.replace('@', ''), // Убираем @ если пользователь ввел
                reason: reason,
                date: new Date().toISOString(),
                voting_count: 0,
                status: 'pending',
                added_by: user?.username || 'anonymous'
            }

            await dataManager.createProfile(profile, files)

            alert(t('reportForm.success'))
            onClose()
        } catch (error) {
            console.error('Error creating report:', error)
            alert(t('reportForm.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="glass-effect rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6">{t('reportForm.title')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.telegramId')}
                        </label>
                        <input
                            type="text"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.username')}
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.reason')}
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('reportForm.reasonPlaceholder')}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors resize-none"
                            rows={4}
                            minLength={10}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.uploadProofs')}
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                        />
                        {files.length > 0 && (
                            <p className="text-sm text-dark-muted mt-2">
                                Выбрано файлов: {files.length}
                            </p>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 rounded bg-warning hover:bg-warning-dark disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? t('common.loading') : t('reportForm.submit')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                        >
                            {t('reportForm.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReportUserModal
