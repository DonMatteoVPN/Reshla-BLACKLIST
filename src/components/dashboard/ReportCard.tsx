import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Report } from '../../types/report'
import ReportDetailsModal from '../modals/ReportDetailsModal'
import { Clock, ThumbsUp } from 'lucide-react'

interface ReportCardProps {
    report: Report
    onVoteSuccess?: () => void
}

const ReportCard = ({ report, onVoteSuccess }: ReportCardProps) => {
    const { t } = useTranslation()
    const [showDetails, setShowDetails] = useState(false)

    const isVoting = report.status === 'voting'
    const timeLeft = isVoting && report.voting_deadline ? new Date(report.voting_deadline).getTime() - Date.now() : 0
    const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)))

    const statusColors = {
        voting: 'bg-warning text-black',
        moderation: 'bg-info text-white',
        approved: 'bg-danger text-white',
        rejected: 'bg-dark-muted text-white'
    }

    return (
        <>
            <div
                onClick={() => setShowDetails(true)}
                className="glass-effect rounded-lg p-6 cursor-pointer hover:border-accent transition-all animate-fade-in relative overflow-hidden group"
            >
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-3 py-1 text-sm font-bold rounded-bl-lg ${statusColors[report.status]}`}>
                    {report.status.toUpperCase()}
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚠️</span>
                        <h3 className="text-xl font-bold font-mono">{report.telegram_id}</h3>
                    </div>

                    <div className="space-y-1">
                        <p className="text-dark-muted text-sm">{t('reportCard.username')}</p>
                        <p className="text-lg">@{report.username}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-dark-muted text-sm">{t('reportCard.reason')}</p>
                        <p className="line-clamp-2">{report.reason}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-dark-border">
                        <div className="flex items-center space-x-2 text-accent">
                            <ThumbsUp size={18} />
                            <span className="font-bold">{report.vote_count}</span>
                        </div>
                        {isVoting && (
                            <div className="flex items-center space-x-2 text-warning">
                                <Clock size={18} />
                                <span>{hoursLeft}h left</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-5 transition-opacity" />
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
