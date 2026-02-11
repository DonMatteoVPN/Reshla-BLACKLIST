import { useTranslation } from 'react-i18next'

const AdminPanel = () => {
    const { t } = useTranslation()

    return (
        <div className="glass-effect rounded-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">{t('admin.title')}</h2>
            <div className="space-y-4">
                <p className="text-dark-muted">
                    {t('admin.description') || 'Admin Panel Under Construction'}
                </p>
                {/* Future Admin Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-surface p-4 rounded border border-dark-border">
                        <h3 className="font-bold mb-2">Configuration</h3>
                        <p className="text-sm text-dark-muted">Manage threshold settings and timeouts.</p>
                    </div>
                    <div className="bg-dark-surface p-4 rounded border border-dark-border">
                        <h3 className="font-bold mb-2">Moderator Logs</h3>
                        <p className="text-sm text-dark-muted">View moderator actions and history.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminPanel
