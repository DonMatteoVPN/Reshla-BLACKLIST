import { useTranslation } from 'react-i18next'

const Footer = () => {
    const { t } = useTranslation()

    return (
        <footer className="border-t border-dark-border bg-dark-bg py-8 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <p className="text-dark-muted text-sm mb-2">
                    &copy; {new Date().getFullYear()} {t('app.title')}
                </p>
                <p className="text-dark-muted text-xs">
                    {t('app.description')}
                </p>
                <div className="mt-4 flex justify-center space-x-4">
                    <a
                        href="https://github.com/DonMatteoVPN/Reshla-BLACKLIST"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dark-muted hover:text-white transition-colors"
                    >
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    )
}

export default Footer
