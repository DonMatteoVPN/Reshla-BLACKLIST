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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-dark-muted">{t('common.loading')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl md:text-6xl font-black gradient-text uppercase tracking-tighter">
                    {t('votingHub.title')}
                </h1>
                <p className="text-xl text-dark-muted max-w-2xl mx-auto">
                    {t('votingHub.description')}
                </p>
                <div className="flex justify-center gap-8 text-sm font-mono mt-4">
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-success">{reports.length}</span>
                        <span className="text-dark-muted">ACTIVE POLLS</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-warning">24h</span>
                        <span className="text-dark-muted">VOTING PERIOD</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-primary">30</span>
                        <span className="text-dark-muted">VOTES NEEDED</span>
                    </div>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 glass-effect rounded-xl">
                    <h3 className="text-2xl font-bold mb-2">All Quiet on the Western Front</h3>
                    <p className="text-dark-muted">No active voting sessions at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reports.map((report) => (
                        <div key={report.id} className="transform hover:scale-[1.02] transition-transform duration-300">
                            <ReportCard
                                report={report}
                                onVoteSuccess={loadVotingReports}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default VotingHub
