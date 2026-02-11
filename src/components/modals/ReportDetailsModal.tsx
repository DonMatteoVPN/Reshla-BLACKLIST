import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import type { ReportWithProofs } from '../../types/report'

interface ReportDetailsModalProps {
    reportId: number
    onClose: () => void
    onUpdate?: () => void
}

const ReportDetailsModal = ({ reportId, onClose, onUpdate }: ReportDetailsModalProps) => {
    const { t } = useTranslation()
    const { issuesService, user, isModerator } = useAuth()
    const [report, setReport] = useState<ReportWithProofs | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadReportDetails()
    }, [reportId])

    const loadReportDetails = async () => {
        if (!issuesService) return

        setIsLoading(true)
        try {
            const data = await issuesService.getReportDetails(reportId)
            setReport(data)
        } catch (error) {
            console.error('Error loading report details:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!comment.trim() || !issuesService) return

        setIsSubmitting(true)
        try {
            await issuesService.addComment(reportId, comment)
            setComment('')
            loadReportDetails() // Reload to show new comment
        } catch (error) {
            console.error('Error adding comment:', error)
            alert(t('reportDetails.commentError'))
        } finally {
            setIsSubmitting(false)
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

    if (!report) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in overflow-y-auto py-10">
            <div className="glass-effect rounded-lg p-6 max-w-2xl w-full mx-4 my-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-dark-muted hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-6">{t('reportDetails.title')} #{report.id}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <h3 className="text-sm font-medium text-dark-muted mb-1">{t('reportCard.telegramId')}</h3>
                        <p className="text-lg font-mono bg-dark-surface p-2 rounded">{report.telegram_id}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-dark-muted mb-1">{t('reportCard.username')}</h3>
                        <p className="text-lg">@{report.username}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-medium text-dark-muted mb-2">{t('reportCard.reason')}</h3>
                    <div className="bg-dark-surface p-4 rounded text-dark-text whitespace-pre-wrap">
                        {report.reason}
                    </div>
                </div>

                {report.proofs.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-dark-muted mb-3">{t('reportDetails.proofs')}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {report.proofs.map((proof, index) => (
                                <a
                                    key={index}
                                    href={proof}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block aspect-square bg-dark-surface rounded overflow-hidden hover:opacity-80 transition-opacity"
                                >
                                    <img
                                        src={proof}
                                        alt={`Proof ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-dark-border pt-6">
                    <h3 className="text-lg font-bold mb-4">{t('reportDetails.discussion')}</h3>
                    
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {report.comments.map((comment) => (
                            <div key={comment.id} className="bg-dark-surface p-3 rounded">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-sm text-primary">{comment.user.login}</span>
                                    <span className="text-xs text-dark-muted">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                            </div>
                        ))}
                        {report.comments.length === 0 && (
                            <p className="text-dark-muted text-center py-4">{t('reportDetails.noComments')}</p>
                        )}
                    </div>

                    {user && (
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t('reportDetails.commentPlaceholder')}
                                className="flex-1 px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!comment.trim() || isSubmitting}
                                className="px-4 py-2 rounded bg-primary hover:bg-primary-dark disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? '...' : '➤'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ReportDetailsModal
