import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import ReportCard from '../components/dashboard/ReportCard'
import BanConfirmationModal from '../components/modals/BanConfirmationModal'
import RejectReportModal from '../components/modals/RejectReportModal'
import type { Report } from '../types/report'

const ModerationDashboard = () => {
    const { t } = useTranslation()
    const { issuesService, isModerator } = useAuth()
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null) // Using string telegram_id for ban modal, but need Number ID for API?
    // Correction: Ban modal needs telegram_id for display, but API needs issue_number (report.id)
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [actionType, setActionType] = useState<'ban' | 'reject' | null>(null)

    useEffect(() => {
        loadReports()
    }, [issuesService])

    const loadReports = async () => {
        if (!issuesService) return
        setIsLoading(true)
        try {
            const data = await issuesService.getReports('moderation')
            setReports(data)
        } catch (error) {
            console.error('Error loading reports:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleApprove = (report: Report) => {
        setSelectedReport(report)
        setActionType('ban')
    }

    const handleReject = (report: Report) => {
        setSelectedReport(report)
        setActionType('reject')
    }

    const confirmBan = async () => {
        if (!selectedReport || !issuesService) return
        try {
            await issuesService.approveReport(selectedReport.id) // approveReport triggers ban workflow
            loadReports()
            setSelectedReport(null)
            setActionType(null)
        } catch (error) {
            console.error('Error approving report:', error)
            alert('Failed to approve report')
        }
    }

    const confirmReject = async (reason: string) => {
        if (!selectedReport || !issuesService) return
        try {
            await issuesService.rejectReport(selectedReport.id, reason)
            loadReports()
            setSelectedReport(null)
            setActionType(null)
        } catch (error) {
            console.error('Error rejecting report:', error)
            alert('Failed to reject report')
        }
    }

    if (!isModerator) {
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
            <h1 className="text-3xl font-bold">{t('moderationDashboard.title')}</h1>
            
            <div className="flex gap-4 mb-6">
                <div className="bg-dark-surface p-4 rounded-lg flex-1">
                    <h3 className="text-dark-muted text-sm uppercase mb-1">{t('moderationDashboard.queueLength')}</h3>
                    <p className="text-3xl font-bold text-primary">{reports.length}</p>
                </div>
                <div className="bg-dark-surface p-4 rounded-lg flex-1">
                    <h3 className="text-dark-muted text-sm uppercase mb-1">Status</h3>
                    <p className="text-3xl font-bold text-success">Active</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-12 text-dark-muted">
                    {t('moderationDashboard.emptyQueue')}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="glass-effect p-6 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-mono bg-dark-bg px-2 py-1 rounded text-primary">{report.telegram_id}</span>
                                    <span className="text-dark-muted">@{report.username}</span>
                                </div>
                                <p className="text-sm mb-2">{report.reason}</p>
                                <div className="flex gap-4 text-xs text-dark-muted">
                                    <span>Votes: {report.vote_count}</span>
                                    <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleReject(report)}
                                    className="flex-1 md:flex-none px-4 py-2 rounded bg-dark-surface hover:bg-danger hover:text-white transition-colors border border-dark-border"
                                >
                                    {t('reportCard.reject')}
                                </button>
                                <button
                                    onClick={() => handleApprove(report)}
                                    className="flex-1 md:flex-none px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors font-bold shadow-lg shadow-primary/20"
                                >
                                    {t('reportCard.approve')} (Ban)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {actionType === 'ban' && selectedReport && (
                <BanConfirmationModal
                    telegramId={selectedReport.telegram_id}
                    onClose={() => {
                        setSelectedReport(null)
                        setActionType(null)
                    }}
                    onConfirm={confirmBan}
                />
            )}

            {actionType === 'reject' && selectedReport && (
                <RejectReportModal
                    onClose={() => {
                        setSelectedReport(null)
                        setActionType(null)
                    }}
                    onSubmit={confirmReject}
                />
            )}
        </div>
    )
}

export default ModerationDashboard
