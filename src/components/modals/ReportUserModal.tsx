import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Octokit } from '@octokit/rest'

interface ReportUserModalProps {
    onClose: () => void
}

const ReportUserModal = ({ onClose }: ReportUserModalProps) => {
    const { t } = useTranslation()
    const { token, owner, repo, user, issuesService } = useAuth()
    const [telegramId, setTelegramId] = useState('')
    const [username, setUsername] = useState('')
    const [reason, setReason] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const base64String = reader.result?.toString().split(',')[1]
                if (base64String) resolve(base64String)
                else reject(new Error('Failed to convert file to base64'))
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!issuesService || !user) {
            alert(t('auth.loginRequired'))
            return
        }

        setIsLoading(true)

        try {
            const octokit = new Octokit({ auth: token })
            const uploadedUrls: string[] = []
            const tempId = Date.now().toString()

            for (const file of files) {
                const content = await fileToBase64(file)
                const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                const path = `data/proofs_upload/${tempId}/${safeName}`

                await octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path,
                    message: `Upload proof for pending report`,
                    content
                })

                const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`
                uploadedUrls.push(fileUrl)
            }

            const report = await issuesService.createReport(
                telegramId,
                username.replace('@', ''),
                reason,
                uploadedUrls
            )

            if (!report) {
                throw new Error('Failed to create report')
            }

            alert(t('reportForm.success'))
            onClose()
        } catch (error) {
            console.error('Error creating report:', error)
            alert(t('reportForm.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="glass-effect rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6">{t('reportForm.title')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.telegramId')}
                        </label>
                        <input
                            type="text"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.username')}
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.reason')}
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('reportForm.reasonPlaceholder')}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors resize-none"
                            rows={4}
                            minLength={10}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('reportForm.uploadProofs')}
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                        />
                        {files.length > 0 && (
                            <p className="text-sm text-dark-muted mt-2">
                                Выбрано файлов: {files.length}
                            </p>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 rounded bg-warning hover:bg-warning-dark disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? t('common.loading') : t('reportForm.submit')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                        >
                            {t('reportForm.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReportUserModal
