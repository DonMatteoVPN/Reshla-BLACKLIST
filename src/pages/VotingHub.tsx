import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import ReportCard from '../components/dashboard/ReportCard'
import type { Report } from '../types/report'

const VotingHub = () => {
    const { t } = useTranslation()
    const { issuesService } = useAuth()
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadVotingReports()
    }, [issuesService])

    const loadVotingReports = async () => {
        if (!issuesService) return
        setIsLoading(true)
        try {
            const data = await issuesService.getReports('voting')
            setReports(data)
        } catch (error) {
            console.error('Error loading voting reports:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="text-center py-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-warning to-danger mb-4">
                    {t('votingHub.title')}
                </h1>
                <p className="text-xl text-dark-muted max-w-2xl mx-auto">
                    {t('votingHub.subtitle')}
                </p>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                    <span className="w-3 h-3 rounded-full bg-warning mr-2 animate-pulse"></span>
                    {t('votingHub.activeVotes')}
                </h2>
                <div className="text-dark-muted text-sm">
                    {reports.length} {t('reportCard.remaining')}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <p className="text-dark-muted">{t('common.loading')}</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-20 bg-dark-surface/50 rounded-lg border border-dark-border border-dashed">
                    <h3 className="text-xl font-medium mb-2">{t('votingHub.noActiveVotes')}</h3>
                    <p className="text-dark-muted">{t('votingHub.checkBackLater')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <ReportCard 
                            key={report.id} 
                            report={report} 
                            onUpdate={loadVotingReports}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default VotingHub
