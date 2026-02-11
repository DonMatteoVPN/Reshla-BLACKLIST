import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import type { Report } from '../../types/report'
import ReportDetailsModal from '../modals/ReportDetailsModal'

interface ReportCardProps {
    report: Report
    onVoteSuccess?: () => void
}

const ReportCard = ({ report, onVoteSuccess }: ReportCardProps) => {
    const { t } = useTranslation()
    const { user, issuesService } = useAuth()
    const [showDetails, setShowDetails] = useState(false)
    const [isVoting, setIsVoting] = useState(false)
    const [hasVoted, setHasVoted] = useState(false)

    const statusColor = {
        voting: 'bg-warning',
        moderation: 'bg-primary',
        approved: 'bg-success',
        rejected: 'bg-danger'
    }[report.status]

    const statusText = {
        voting: t('reportCard.statusVoting'),
        moderation: t('reportCard.statusModeration'),
        approved: t('reportCard.statusApproved'),
        rejected: t('reportCard.statusRejected')
    }[report.status]

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!user || isVoting || hasVoted || !issuesService) return

        setIsVoting(true)
        try {
            await issuesService.vote(report.id)
            setHasVoted(true)
            if (onVoteSuccess) onVoteSuccess()
        } catch (error) {
            console.error('Error voting:', error)
            alert(t('reportCard.voteError'))
        } finally {
            setIsVoting(false)
        }
    }

    const getTimeRemaining = () => {
        const deadline = new Date(report.voting_deadline)
        const now = new Date()
        const diff = deadline.getTime() - now.getTime()

        if (diff <= 0) return t('reportCard.votingClosed')

        const minutes = Math.floor(diff / 1000 / 60)
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60

        if (hours > 0) {
            return `${hours}h ${mins}m ${t('reportCard.remaining')}`
        }
        return `${mins}m ${t('reportCard.remaining')}`
    }

    return (
        <>
            <div
                onClick={() => setShowDetails(true)}
                className="glass-effect rounded-lg p-6 cursor-pointer hover:border-primary transition-all animate-fade-in"
            >
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded text-sm ${statusColor}`}>
                        {statusText}
                    </span>
                    {report.status === 'voting' && (
                        <span className="text-dark-muted text-sm">
                            {getTimeRemaining()}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportCard.telegramId')}</p>
                        <p className="font-mono">{report.telegram_id}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportCard.username')}</p>
                        <p>@{report.username}</p>
                    </div>
                    <div>
                        <p className="text-dark-muted text-sm">{t('reportCard.reason')}</p>
                        <p className="line-clamp-2">{report.reason}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-dark-muted text-sm">{t('reportCard.votes')}</p>
                            <p className="font-bold text-lg">{report.vote_count}</p>
                        </div>
                        {report.status === 'voting' && user && (
                            <button
                                onClick={handleVote}
                                disabled={isVoting || hasVoted}
                                className={`px-4 py-2 rounded transition-colors ${hasVoted
                                    ? 'bg-dark-surface text-dark-muted cursor-not-allowed'
                                    : 'bg-warning hover:bg-warning-dark'
                                    }`}
                            >
                                {hasVoted ? t('reportCard.voted') : t('reportCard.vote')}
                            </button>
                        )}
                    </div>
                </div>

                <button className="mt-4 w-full px-4 py-2 rounded bg-primary hover:bg-primary-dark transition-colors">
                    {t('reportCard.viewDetails')}
                </button>
            </div>

            {showDetails && (
                <ReportDetailsModal
                    reportId={report.id}
                    onClose={() => setShowDetails(false)}
                    onUpdate={onVoteSuccess}
                />
            )}
        </>
    )
}

export default ReportCard
