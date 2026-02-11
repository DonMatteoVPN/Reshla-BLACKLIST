import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RejectReportModalProps {
    onSubmit: (reason: string) => void
    onClose: () => void
}

const RejectReportModal = ({ onSubmit, onClose }: RejectReportModalProps) => {
    const { t } = useTranslation()
    const [reason, setReason] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason.trim()) return
        onSubmit(reason)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="glass-effect rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">{t('rejectModal.title')}</h2>
                
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('rejectModal.reasonPlaceholder')}
                        className="w-full px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-danger outline-none transition-colors h-32 resize-none mb-4"
                        required
                    />

                    <div className="flex space-x-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!reason.trim()}
                            className="px-4 py-2 rounded bg-danger hover:bg-danger-dark disabled:opacity-50 transition-colors"
                        >
                            {t('rejectModal.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RejectReportModal
