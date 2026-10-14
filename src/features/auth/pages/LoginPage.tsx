import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/features/branding'
import { useAuth } from '../useAuth'
import styles from './LoginPage.module.css'

const features = [
  { icon: 'bi-geo-alt', key: 'auth.features.field' },
  { icon: 'bi-graph-up-arrow', key: 'auth.features.insights' },
  { icon: 'bi-shield-check', key: 'auth.features.secure' },
]

export function LoginPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  if (user) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError(t('auth.required'))
      return
    }
    try {
      await login(email, password)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className={styles.page}>
      <aside data-bs-theme="dark" className={`${styles.hero} d-none d-lg-flex`}>
        <BrandLogo size="lg" />
        <div>
          <h2 className="h3 text-body-emphasis mb-2">{t('auth.tagline')}</h2>
          <p className="text-body-secondary mb-4">{t('auth.taglineSub')}</p>
          <ul className="list-unstyled vstack gap-2 mb-0">
            {features.map((f) => (
              <li key={f.key} className="d-flex align-items-center gap-2 small">
                <i className={`bi ${f.icon} ${styles.featureIcon}`} aria-hidden="true" />
                <span className="text-body-emphasis">{t(f.key)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="small text-body-secondary mb-0">© {new Date().getFullYear()} PharmaSales</p>
      </aside>

      <main className="d-flex align-items-center justify-content-center p-3 p-sm-4">
        <form className={`card ${styles.card}`} onSubmit={handleSubmit} noValidate>
          <div className="card-body p-4 d-flex flex-column gap-3">
            <div className="d-lg-none mb-2">
              <BrandLogo />
            </div>
            <div>
              <h1 className="h4 mb-1">{t('auth.welcome')}</h1>
              <p className="text-body-secondary mb-0">{t('auth.subtitle')}</p>
            </div>
            <div>
              <label htmlFor="login-email" className="form-label small fw-semibold">
                {t('auth.email')}
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope" aria-hidden="true" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.gr"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="form-label small fw-semibold">
                {t('auth.password')}
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock" aria-hidden="true" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-0" role="alert">
                <i className="bi bi-exclamation-circle" aria-hidden="true" />
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary mt-2">
              {t('auth.signIn')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
