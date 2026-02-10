import { useTranslation } from 'react-i18next'

const Footer = () => {
    const { t } = useTranslation()
    const currentYear = new Date().getFullYear()

    return (
        <footer className="glass-effect mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between text-dark-muted text-sm">
                    <p>
                        © {currentYear} {t('app.title')}
                    </p>
                    <p>{t('app.description')}</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
