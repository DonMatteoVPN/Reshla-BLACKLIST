import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import type { Report, ReportStatus, ModeratorAction } from '../../types/report'
import ReportCard from './ReportCard'
import ReportUserModal from '../modals/ReportUserModal'

const Dashboard = () => {
    const { t } = useTranslation()
    const { isAuthenticated, issuesService } = useAuth()
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'voting' | 'pending_review' | 'approved' | 'rejected'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showReportModal, setShowReportModal] = useState(false)

    useEffect(() => {
        loadReports()
    }, [issuesService])

    const loadReports = async () => {
        if (!issuesService) return

        setIsLoading(true)
        try {
            // Map UI filter to Service status
            let status: ReportStatus | 'all' = 'all'
            if (filter === 'approved') status = 'approved'
            if (filter === 'rejected') status = 'rejected'
            if (filter === 'voting') status = 'voting'
            if (filter === 'pending_review') status = 'moderation'

            const data = await issuesService.getReports(status)
            setReports(data)
        } catch (error) {
            console.error('Error loading reports:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredReports = reports.filter((report) => {
        if (filter !== 'all' && report.status !== filter) return false
        if (searchQuery && !report.telegram_id.includes(searchQuery)) return false
        return true
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-dark-muted">{t('common.loading')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
                {isAuthenticated && (
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="px-4 py-2 rounded bg-warning hover:bg-warning-dark transition-colors"
                    >
                        {t('dashboard.reportUser')}
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded transition-colors ${filter === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                            }`}
                    >
                        {t('dashboard.filterAll')}
                    </button>
                    <button
                        onClick={() => setFilter('voting')}
                        className={`px-4 py-2 rounded transition-colors ${filter === 'voting'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                            }`}
                    >
                        {t('dashboard.filterVoting')}
                    </button>
                    <button
                        onClick={() => setFilter('pending_review')}
                        className={`px-4 py-2 rounded transition-colors ${filter === 'pending_review'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                            }`}
                    >
                        {t('dashboard.filterPendingReview')}
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 rounded transition-colors ${filter === 'approved'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                            }`}
                    >
                        {t('dashboard.filterApproved')}
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`px-4 py-2 rounded transition-colors ${filter === 'rejected'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                            }`}
                    >
                        {t('dashboard.filterRejected')}
                    </button>
                </div>

                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('dashboard.searchPlaceholder')}
                    className="flex-1 px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                />
            </div>

            {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-dark-muted">
                    {t('dashboard.noResults')}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onVoteSuccess={loadReports}
                        />
                    ))}
                </div>
            )}

            {showReportModal && (
                <ReportUserModal onClose={() => {
                    setShowReportModal(false)
                    loadReports()
                }} />
            )}
        </div>
    )
}

export default Dashboard
