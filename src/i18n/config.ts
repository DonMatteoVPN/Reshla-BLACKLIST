import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'
import en from './en.json'

// Инициализация i18next
i18n
    .use(initReactI18next)
    .init({
        resources: {
            ru: { translation: ru },
            en: { translation: en },
        },
        lng: 'ru', // Язык по умолчанию
        fallbackLng: 'ru',
        interpolation: {
            escapeValue: false, // React уже экранирует значения
        },
    })

export default i18n
