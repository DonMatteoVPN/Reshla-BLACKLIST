import { useTranslation } from 'react-i18next'

interface BanConfirmationModalProps {
    telegramId: string
    onClose: () => void
    onConfirm: () => void
}

const BanConfirmationModal = ({ telegramId, onClose, onConfirm }: BanConfirmationModalProps) => {
    const { t } = useTranslation()

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="glass-effect rounded-lg p-6 max-w-sm w-full mx-4 text-center">
                <div className="text-6xl mb-4">🔨</div>
                <h2 className="text-xl font-bold mb-2">{t('banModal.title')}</h2>
                <p className="text-dark-muted mb-6">
                    {t('banModal.confirmation', { telegramId })}
                </p>

                <div className="flex space-x-3 justify-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-dark-surface hover:bg-dark-border transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-danger hover:bg-danger-dark transition-colors font-bold"
                    >
                        {t('banModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BanConfirmationModal
