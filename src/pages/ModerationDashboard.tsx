import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ReportCard from '../components/dashboard/ReportCard'
import type { Report } from '../types/report'

const ModerationDashboard = () => {
    const { t } = useTranslation()
    const { issuesService, isModerator, isLoading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !isModerator) {
            navigate('/')
        }
    }, [isModerator, authLoading, navigate])

    useEffect(() => {
        if (isModerator) {
            loadReports()
        }
    }, [issuesService, isModerator])

    const loadReports = async () => {
        if (!issuesService) return
        setIsLoading(true)
        try {
            const data = await issuesService.getReports('moderation')
            setReports(data)
        } catch (error) {
            console.error('Error loading moderation reports:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isModerator) return null

    return (
        <div className="space-y-8">
             <div className="text-center py-8">
                <h1 className="text-3xl md:text-4xl font-bold text-danger mb-4">
                    {t('moderationDashboard.title')}
                </h1>
                <p className="text-lg text-dark-muted">
                    {t('moderationDashboard.subtitle')}
                </p>
            </div>

            <div className="bg-dark-surface rounded-lg p-6 border border-dark-border flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">{t('moderationDashboard.queueSize')}</h3>
                    <p className="text-3xl font-bold text-accent">{reports.length}</p>
                </div>
                {reports.length === 0 && (
                    <div className="text-success text-center px-4 py-2 bg-success/10 rounded">
                        {t('moderationDashboard.queueEmpty')}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <p className="text-dark-muted">{t('common.loading')}</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-dark-muted mb-4">
                        (⌐■_■)
                    </p>
                    <p className="text-dark-muted">{t('moderationDashboard.goodJob')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <ReportCard 
                            key={report.id} 
                            report={report} 
                            onUpdate={loadReports}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ModerationDashboard
