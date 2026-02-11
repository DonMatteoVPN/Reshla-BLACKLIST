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
    const [files, setFiles] = useState<FileList | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token || !issuesService) {
            alert(t('auth.loginRequired'))
            return
        }

        setIsSubmitting(true)
        setUploadProgress(10) // Start progress

        try {
            // 1. Upload images to GitHub (or external host if configured, but for now we'll simulate or skip actual file upload logic complexity for MVP and just use URLs if available or placeholder.
            // Wait, standard GitHub Issues allow drag-and-drop which uploads to user-assets...
            // API doesn't support direct upload to issue attachments easily without valid session cookies usually.
            // Alternative: Upload to a separate 'evidence' branch or folder in the repo?
            // "Report Flow: Form -> Issue Creation (with image upload handling)" task implies we need this.
            // Let's implement a simple "Upload to Repo" strategy: data/evidence/{telegramId}/{timestamp}-{filename}

            const imageUrls: string[] = []

            if (files && files.length > 0) {
                const octokit = new Octokit({ auth: token })
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    const reader = new FileReader()

                    const base64Content = await new Promise<string>((resolve, reject) => {
                        reader.onload = () => {
                            const result = reader.result as string
                            // Remove data URL prefix
                            const base64 = result.split(',')[1]
                            resolve(base64)
                        }
                        reader.onerror = reject
                        reader.readAsDataURL(file)
                    })

                    const path = `evidence/${telegramId}/${Date.now()}-${file.name}`
                    
                    await octokit.rest.repos.createOrUpdateFileContents({
                        owner,
                        repo,
                        path,
                        message: `chore: Evidence for ${telegramId}`,
                        content: base64Content,
                        branch: 'main' // or a specific evidence branch
                    })

                    // Construct raw URL (assuming public repo or access)
                    // Format: https://raw.githubusercontent.com/{owner}/{repo}/main/{path}
                    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`
                    imageUrls.push(rawUrl)

                    setUploadProgress(10 + ((i + 1) / files.length) * 40) // Scale to 50%
                }
            }

            setUploadProgress(60)

            // 2. Create Issue
            await issuesService.createReport({
                telegram_id: telegramId,
                username,
                reason,
                proofs: imageUrls
            })

            setUploadProgress(100)
            alert(t('reportModal.success'))
            onClose()

        } catch (error) {
            console.error('Error submitting report:', error)
            alert(t('reportModal.error'))
        } finally {
            setIsSubmitting(false)
            setUploadProgress(0)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="glass-effect rounded-lg p-6 max-w-lg w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t('reportModal.title')}</h2>
                    <button onClick={onClose} className="text-dark-muted hover:text-white transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('reportCard.telegramId')}</label>
                        <input
                            type="text"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            placeholder="123456789"
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('reportCard.username')}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-2 text-dark-muted">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="username"
                                className="w-full pl-8 pr-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('reportCard.reason')}</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('reportModal.reasonPlaceholder')}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors h-32 resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('reportModal.proofs')}</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setFiles(e.target.files)}
                            className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark transition-colors"
                        />
                    </div>

                    {isSubmitting && (
                        <div className="w-full bg-dark-surface rounded-full h-2.5">
                            <div
                                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded bg-primary hover:bg-primary-dark disabled:opacity-50 transition-colors font-bold"
                        >
                            {isSubmitting ? t('common.loading') : t('reportModal.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReportUserModal
