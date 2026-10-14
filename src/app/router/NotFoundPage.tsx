import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section>
      <h1>{t('notFound.title')}</h1>
      <p>
        <Link to="/">{t('notFound.back')}</Link>
      </p>
    </section>
  )
}
