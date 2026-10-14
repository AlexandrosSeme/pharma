import { useTranslation } from 'react-i18next'
import { languages } from '@/app/i18n'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()

  return (
    <div className="btn-group btn-group-sm" role="group" aria-label={t('nav.language')}>
      {languages.map((lng) => (
        <button
          key={lng}
          type="button"
          className={`btn btn-outline-secondary${i18n.resolvedLanguage === lng ? ' active' : ''}`}
          aria-pressed={i18n.resolvedLanguage === lng}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
