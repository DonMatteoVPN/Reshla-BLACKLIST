import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import ReportDetailsModal from '../modals/ReportDetailsModal'
import type { Report } from '../../types/report'

interface ReportCardProps {
    report: Report
    onUpdate?: () => void
}

const ReportCard = ({ report, onUpdate }: ReportCardProps) => {
    const { t } = useTranslation()
    const { issuesService, user } = useAuth()
    const [voteCount, setVoteCount] = useState(report.vote_count)
    const [hasVoted, setHasVoted] = useState(false) // Optimistic UI
    const [showDetails, setShowDetails] = useState(false)
    const [isVoting, setIsVoting] = useState(false)

    // Calculate time remaining
    const deadline = new Date(report.voting_deadline)
    const now = new Date()
    const timeLeftMs = deadline.getTime() - now.getTime()
    const timeLeftHours = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)))
    const isVotingClosed = timeLeftMs <= 0

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!issuesService || !user || hasVoted) return

        setIsVoting(true)
        try {
            await issuesService.vote(report.id)
            setVoteCount((prev) => prev + 1)
            setHasVoted(true)
        } catch (error) {
            console.error('Error voting:', error)
            alert(t('reportCard.voteError'))
        } finally {
            setIsVoting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'voting':
                return 'text-warning border-warning'
            case 'moderation':
                return 'text-accent border-accent'
            case 'approved':
                return 'text-danger border-danger'
            case 'rejected':
                return 'text-success border-success' // Green for rejected (innocent)
            default:
                return 'text-secondary border-secondary'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'voting':
                return t('reportCard.statusVoting')
            case 'moderation':
                return t('reportCard.statusPendingReview')
            case 'approved':
                return t('reportCard.statusApproved')
            case 'rejected':
                return t('reportCard.statusRejected')
            default:
                return status
        }
    }

    return (
        <>
            <div className="bg-dark-surface rounded-lg p-5 border border-dark-border hover:border-primary transition-colors flex flex-col h-full group">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(report.status)} bg-opacity-10`}>
                        {getStatusText(report.status)}
                    </span>
                    {report.status === 'voting' && (
                        <span className="text-xs text-dark-muted flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {isVotingClosed ? t('reportCard.votingClosed') : `${timeLeftHours}h ${t('reportCard.remaining')}`}
                        </span>
                    )}
                </div>

                <div className="mb-4 flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-dark-muted text-sm w-24">{t('reportCard.telegramId')}:</span>
                        <span className="font-mono bg-dark-bg px-1 rounded">{report.telegram_id}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-dark-muted text-sm w-24">{t('reportCard.username')}:</span>
                        <span className="text-primary">@{report.username}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-sm font-medium mb-1">{t('reportCard.reason')}:</p>
                    <p className="text-sm text-dark-muted line-clamp-2">{report.reason}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-dark-border">
                    <div className="flex items-center space-x-1 text-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span className="font-bold">{voteCount}</span>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowDetails(true)}
                            className="px-3 py-1.5 rounded text-sm bg-dark-bg hover:bg-dark-border transition-colors text-dark-muted hover:text-white"
                        >
                            {t('reportCard.viewDetails')}
                        </button>
                        
                        {report.status === 'voting' && !hasVoted && !isVotingClosed && user && (
                            <button
                                onClick={handleVote}
                                disabled={isVoting}
                                className="px-3 py-1.5 rounded text-sm bg-warning hover:bg-warning-dark text-white transition-colors flex items-center"
                            >
                                {isVoting ? '...' : t('reportCard.vote')}
                            </button>
                        )}
                        
                        {hasVoted && (
                            <span className="text-xs text-success flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {t('reportCard.voted')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {showDetails && (
                <ReportDetailsModal 
                    reportId={report.id} 
                    onClose={() => setShowDetails(false)}
                    onUpdate={onUpdate}
                />
            )}
        </>
    )
}

export default ReportCard
