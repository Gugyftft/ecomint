import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import hi from './locales/hi'
import mr from './locales/mr'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    fallbackLng: 'en',
    lng: localStorage.getItem('ecomint_lang') ?? undefined,
    interpolation: { escapeValue: false },
  })

export default i18n