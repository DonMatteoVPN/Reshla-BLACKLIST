import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { DataManager } from '../../services/DataManager'
import type { Roles } from '../../types/roles'

const AdminPanel = () => {
    const { t } = useTranslation()
    const { token, owner, repo, isAdmin, isLoading: authLoading } = useAuth()
    const [roles, setRoles] = useState<Roles>({ admins: [], moderators: [] })
    const [newAdmin, setNewAdmin] = useState('')
    const [newModerator, setNewModerator] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    // Загрузка ролей
    useEffect(() => {
        if (!token || !isAdmin) {
            if (!authLoading && !isAdmin) {
                // Redirect logic handled by router usually, but here we show access denied
                setIsLoading(false)
            }
            return
        }

        const fetchRoles = async () => {
            try {
                const dataManager = new DataManager(token, owner, repo)
                const data = await dataManager.getRoles()
                setRoles(data)
            } catch (error) {
                console.error('Error fetching roles:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRoles()
    }, [token, isAdmin, authLoading, owner, repo])

    const handleSaveRoles = async (updatedRoles: Roles) => {
        if (!token) return

        try {
            const dataManager = new DataManager(token, owner, repo)
            await dataManager.updateRoles(updatedRoles)
            setRoles(updatedRoles)
            alert(t('admin.saveSuccess'))
        } catch (error) {
            console.error('Error saving roles:', error)
            alert(t('admin.saveError'))
        }
    }

    const addAdmin = () => {
        if (newAdmin && !roles.admins.includes(newAdmin)) {
            const updated = { ...roles, admins: [...roles.admins, newAdmin] }
            handleSaveRoles(updated)
            setNewAdmin('')
        }
    }

    const removeAdmin = (user: string) => {
        const updated = { ...roles, admins: roles.admins.filter(u => u !== user) }
        handleSaveRoles(updated)
    }

    const addModerator = () => {
        if (newModerator && !roles.moderators.includes(newModerator)) {
            const updated = { ...roles, moderators: [...roles.moderators, newModerator] }
            handleSaveRoles(updated)
            setNewModerator('')
        }
    }

    const removeModerator = (user: string) => {
        const updated = { ...roles, moderators: roles.moderators.filter(u => u !== user) }
        handleSaveRoles(updated)
    }

    if (!isAdmin) {
        return (
            <div className="flex justify-center py-20">
                <p className="text-danger font-bold">{t('admin.accessDenied')}</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <p className="text-dark-muted">{t('common.loading')}</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">
                {t('admin.title')}
            </h1>

            {/* Admins Section */}
            <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
                <h2 className="text-xl font-bold mb-4 text-accent">{t('admin.admins')}</h2>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newAdmin}
                        onChange={(e) => setNewAdmin(e.target.value)}
                        placeholder={t('admin.usernamePlaceholder')}
                        className="flex-1 px-4 py-2 rounded bg-dark-bg border border-dark-border focus:border-accent outline-none"
                    />
                    <button
                        onClick={addAdmin}
                        className="px-4 py-2 rounded bg-accent hover:bg-opacity-80 transition-colors"
                    >
                        {t('admin.addUser')}
                    </button>
                </div>
                <div className="space-y-2">
                    {roles.admins.map(user => (
                        <div key={user} className="flex justify-between items-center p-3 bg-dark-bg rounded border border-dark-border">
                            <span>{user}</span>
                            <button
                                onClick={() => removeAdmin(user)}
                                className="text-danger hover:text-danger-dark"
                            >
                                {t('admin.removeUser')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Moderators Section */}
            <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
                <h2 className="text-xl font-bold mb-4 text-primary">{t('admin.moderators')}</h2>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newModerator}
                        onChange={(e) => setNewModerator(e.target.value)}
                        placeholder={t('admin.usernamePlaceholder')}
                        className="flex-1 px-4 py-2 rounded bg-dark-bg border border-dark-border focus:border-primary outline-none"
                    />
                    <button
                        onClick={addModerator}
                        className="px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors"
                    >
                        {t('admin.addUser')}
                    </button>
                </div>
                <div className="space-y-2">
                    {roles.moderators.map(user => (
                        <div key={user} className="flex justify-between items-center p-3 bg-dark-bg rounded border border-dark-border">
                            <span>{user}</span>
                            <button
                                onClick={() => removeModerator(user)}
                                className="text-danger hover:text-danger-dark"
                            >
                                {t('admin.removeUser')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AdminPanel
