import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { DataManager } from '../../services/DataManager'
import type { Roles } from '../../types/roles'

const AdminPanel = () => {
    const { t } = useTranslation()
    const { token, owner, repo, isAdmin } = useAuth()
    const [roles, setRoles] = useState<Roles>({ admins: [], moderators: [] })
    const [newAdmin, setNewAdmin] = useState('')
    const [newModerator, setNewModerator] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Загрузка ролей
    useEffect(() => {
        if (!token || !isAdmin) {
            setIsLoading(false)
            return
        }

        const loadRoles = async () => {
            try {
                const dataManager = new DataManager(token, owner, repo)
                const rolesData = await dataManager.getRoles()
                setRoles(rolesData)
            } catch (error) {
                console.error('Error loading roles:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadRoles()
    }, [token, owner, repo, isAdmin])

    const handleAddAdmin = () => {
        if (!newAdmin.trim()) return
        setRoles((prev) => ({
            ...prev,
            admins: [...prev.admins, newAdmin.trim()],
        }))
        setNewAdmin('')
    }

    const handleRemoveAdmin = (username: string) => {
        setRoles((prev) => ({
            ...prev,
            admins: prev.admins.filter((u) => u !== username),
        }))
    }

    const handleAddModerator = () => {
        if (!newModerator.trim()) return
        setRoles((prev) => ({
            ...prev,
            moderators: [...prev.moderators, newModerator.trim()],
        }))
        setNewModerator('')
    }

    const handleRemoveModerator = (username: string) => {
        setRoles((prev) => ({
            ...prev,
            moderators: prev.moderators.filter((u) => u !== username),
        }))
    }

    const handleSave = async () => {
        if (!token) return

        setIsSaving(true)
        try {
            const dataManager = new DataManager(token, owner, repo)
            await dataManager.updateRoles(roles)
            alert(t('admin.saveSuccess'))
        } catch (error) {
            console.error('Error saving roles:', error)
            alert(t('admin.saveError'))
        } finally {
            setIsSaving(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-danger">{t('admin.accessDenied')}</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-dark-muted">{t('common.loading')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('admin.title')}</h1>

            <div className="glass-effect rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{t('admin.manageRoles')}</h2>

                {/* Администраторы */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t('admin.admins')}</h3>
                    <div className="space-y-2 mb-3">
                        {roles.admins.map((username) => (
                            <div
                                key={username}
                                className="flex items-center justify-between bg-dark-surface p-3 rounded"
                            >
                                <span>{username}</span>
                                <button
                                    onClick={() => handleRemoveAdmin(username)}
                                    className="px-3 py-1 rounded bg-danger hover:bg-danger-dark transition-colors text-sm"
                                >
                                    {t('admin.removeUser')}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newAdmin}
                            onChange={(e) => setNewAdmin(e.target.value)}
                            placeholder={t('admin.usernamePlaceholder')}
                            className="flex-1 px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                        />
                        <button
                            onClick={handleAddAdmin}
                            className="px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors"
                        >
                            {t('admin.addUser')}
                        </button>
                    </div>
                </div>

                {/* Модераторы */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t('admin.moderators')}</h3>
                    <div className="space-y-2 mb-3">
                        {roles.moderators.map((username) => (
                            <div
                                key={username}
                                className="flex items-center justify-between bg-dark-surface p-3 rounded"
                            >
                                <span>{username}</span>
                                <button
                                    onClick={() => handleRemoveModerator(username)}
                                    className="px-3 py-1 rounded bg-danger hover:bg-danger-dark transition-colors text-sm"
                                >
                                    {t('admin.removeUser')}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newModerator}
                            onChange={(e) => setNewModerator(e.target.value)}
                            placeholder={t('admin.usernamePlaceholder')}
                            className="flex-1 px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                        />
                        <button
                            onClick={handleAddModerator}
                            className="px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors"
                        >
                            {t('admin.addUser')}
                        </button>
                    </div>
                </div>

                {/* Кнопка сохранения */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full px-4 py-2 rounded bg-success hover:bg-success-dark disabled:opacity-50 transition-colors"
                >
                    {isSaving ? t('common.loading') : t('admin.save')}
                </button>
            </div>
        </div>
    )
}

export default AdminPanel
