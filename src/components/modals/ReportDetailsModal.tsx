import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { SupabaseService } from '../../services/SupabaseService'
import { DataManager } from '../../services/DataManager'
import type { ReportWithProofs } from '../../types/report'

interface ReportDetailsModalProps {
    reportId: string
    onClose: () => void
    onUpdate?: () => void
}

const ReportDetailsModal = ({ reportId, onClose, onUpdate }: ReportDetailsModalProps) => {
    const { t } = useTranslation()
    const { token, owner, repo, user, isModerator } = useAuth()
    const [report, setReport] = useState<ReportWithProofs | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [comment, setComment] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        loadReport()
    }, [reportId])

    const loadReport = async () => {
        try {
            const supabase = new SupabaseService()
            const data = await supabase.getReportById(reportId, user?.username)
            setReport(data)
        } catch (error) {
            console.error('Error loading report:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!token || !user || !report) return

        if (!comment.trim()) {
            alert(t('reportDetails.commentRequired'))
            return
        }

        setIsProcessing(true)
        try {
            const supabase = new SupabaseService()
            const dataManager = new DataManager(token, owner, repo)

            await supabase.createModeratorAction(
                reportId,
                user.username,
                'approve',
                comment
            )

            const githubPath = await dataManager.createProfileFromReport(
                report,
                report.proofs
            )

            await supabase.updateReportGithubPath(reportId, githubPath)

            alert(t('reportDetails.approveSuccess'))
            if (onUpdate) onUpdate()
            onClose()
        } catch (error) {
            console.error('Error approving report:', error)
            alert(t('reportDetails.approveError'))
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!user || !report) return

        if (!comment.trim()) {
            alert(t('reportDetails.commentRequired'))
            return
        }

        if (!confirm(t('reportDetails.confirmReject'))) return

        setIsProcessing(true)
        try {
            const supabase = new SupabaseService()

            await supabase.createModeratorAction(
                reportId,
                user.username,
                'reject',
                comment
            )

            alert(t('reportDetails.rejectSuccess'))
            if (onUpdate) onUpdate()
            onClose()
        } catch (error) {
            console.error('Error rejecting report:', error)
            alert(t('reportDetails.rejectError'))
        } finally {
            setIsProcessing(false)
        }
    }

    const handleVote = async () => {
        if (!user || !report || report.user_voted) return

        try {
            const supabase = new SupabaseService()
            const success = await supabase.voteForReport(reportId, user.username)

            if (success) {
                await loadReport()
                if (onUpdate) onUpdate()
            }
        } catch (error) {
            console.error('Error voting:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="glass-effect rounded-lg p-6">
                    <p className="text-dark-muted">{t('common.loading')}</p>
                </div>
            </div>
        )
    }

    if (!report) {
        return null
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="glass-effect rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6">{t('reportDetails.title')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportCard.telegramId')}</p>
                        <p className="font-mono text-lg">{report.telegram_id}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportCard.username')}</p>
                        <p className="text-lg">@{report.username}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportCard.status')}</p>
                        <p className="text-lg">{report.status}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportCard.votes')}</p>
                        <p className="text-lg font-bold">{report.vote_count}</p>
                    </div>
                    <div className="col-span-full">
                        <p className="text-dark-muted text-sm">{t('reportCard.reason')}</p>
                        <p className="text-lg">{report.reason}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportDetails.submittedBy')}</p>
                        <p className="text-lg">{report.submitted_by}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportDetails.createdAt')}</p>
                        <p className="text-lg">{new Date(report.created_at).toLocaleString()}</p>
                    </div>
                </div>

                {report.proofs.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">{t('reportDetails.proofs')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {report.proofs.map((proof) => (
                                <a
                                    key={proof.id}
                                    href={proof.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <img
                                        src={proof.file_url}
                                        alt={proof.file_name}
                                        className="rounded border border-dark-border w-full h-32 object-cover hover:opacity-75 transition-opacity"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {report.moderator_actions.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">{t('reportDetails.moderatorActions')}</h3>
                        <div className="space-y-3">
                            {report.moderator_actions.map((action) => (
                                <div key={action.id} className="bg-dark-surface rounded p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            action.action === 'approve' ? 'bg-success' : 'bg-danger'
                                        }`}>
                                            {action.action === 'approve' ? t('reportDetails.approved') : t('reportDetails.rejected')}
                                        </span>
                                        <span className="text-dark-muted text-sm">
                                            {new Date(action.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-dark-muted mb-1">
                                        {t('reportDetails.moderator')}: {action.moderator_id}
                                    </p>
                                    {action.comment && (
                                        <p className="text-sm">{action.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {report.status === 'voting' && user && !report.user_voted && (
                        <button
                            onClick={handleVote}
                            className="w-full px-4 py-2 rounded bg-warning hover:bg-warning-dark transition-colors"
                        >
                            {t('reportCard.vote')}
                        </button>
                    )}

                    {report.status === 'pending_review' && isModerator && (
                        <>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t('reportDetails.commentPlaceholder')}
                                className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors resize-none"
                                rows={3}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2 rounded bg-success hover:bg-success-dark disabled:opacity-50 transition-colors"
                                >
                                    {t('reportDetails.approve')}
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2 rounded bg-danger hover:bg-danger-dark disabled:opacity-50 transition-colors"
                                >
                                    {t('reportDetails.reject')}
                                </button>
                            </div>
                        </>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                    >
                        {t('reportDetails.close')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReportDetailsModal
