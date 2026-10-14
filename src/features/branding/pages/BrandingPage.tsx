import { Fragment, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo, PageHeader, type LogoOnDark } from '@/shared/ui'
import { LOGO_ACCEPT, LOGO_MAX_BYTES, LogoFileError, readLogoFile } from '../lib/readLogoFile'
import { useBranding } from '../useBranding'
import styles from './BrandingPage.module.css'

const onDarkOptions: { value: LogoOnDark; icon: string }[] = [
  { value: 'original', icon: 'bi-palette' },
  { value: 'white', icon: 'bi-circle-half' },
  { value: 'frame', icon: 'bi-square' },
]

export function BrandingPage() {
  const { t } = useTranslation()
  const { branding, saveBranding, resetBranding } = useBranding()
  const [companyName, setCompanyName] = useState(branding.companyName)
  const [logo, setLogo] = useState(branding.logo)
  const [logoShape, setLogoShape] = useState(branding.logoShape)
  const [logoOnDark, setLogoOnDark] = useState(branding.logoOnDark)
  const [logoDarkTileOnLight, setLogoDarkTileOnLight] = useState(branding.logoDarkTileOnLight)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const fileId = useId()
  const onDarkName = useId()

  const name = companyName.trim()
  const dirty = name !== branding.companyName || logo !== branding.logo || logoOnDark !== branding.logoOnDark

  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setSaved(false)
    }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setSaved(false)
    setProcessing(true)
    try {
      const processed = await readLogoFile(file)
      setLogo(processed.dataUrl)
      setLogoShape(processed.shape)
      setLogoOnDark(processed.onDark)
      setLogoDarkTileOnLight(processed.needsDarkTileOnLight)
    } catch (err) {
      const reason = err instanceof LogoFileError ? err.reason : 'read'
      setError(t(`branding.errors.${reason}`, { size: LOGO_MAX_BYTES / 1024 / 1024 }))
    } finally {
      setProcessing(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    saveBranding({ companyName: name, logo, logoShape, logoOnDark, logoDarkTileOnLight })
    setSaved(true)
  }

  function onReset() {
    resetBranding()
    setCompanyName('')
    setLogo(null)
    setLogoShape('emblem')
    setLogoOnDark('original')
    setLogoDarkTileOnLight(false)
    setError(null)
    setSaved(false)
  }

  const preview = (
    <Logo src={logo} shape={logoShape} name={name} onDark={logoOnDark} darkTileOnLight={logoDarkTileOnLight} />
  )

  return (
    <section>
      <PageHeader title={t('branding.title')} subtitle={t('branding.subtitle')} />

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <form className="card h-100" onSubmit={onSubmit}>
            <div className="card-body d-flex flex-column gap-4">
              <div>
                <label htmlFor={nameId} className="form-label fw-medium">
                  {t('branding.companyName')}
                </label>
                <input
                  id={nameId}
                  className="form-control"
                  value={companyName}
                  maxLength={40}
                  placeholder={t('branding.companyNamePlaceholder')}
                  onChange={(e) => edit(setCompanyName)(e.target.value)}
                />
                <div className="form-text">{t('branding.companyNameHint')}</div>
              </div>

              <div>
                <label htmlFor={fileId} className="form-label fw-medium">
                  {t('branding.logo')}
                </label>
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <div className={styles.thumb}>
                    {logo ? (
                      <img src={logo} alt="" className={styles.thumbImage} />
                    ) : (
                      <i className="bi bi-image fs-4 text-body-secondary" aria-hidden="true" />
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <input
                      ref={fileInput}
                      id={fileId}
                      type="file"
                      accept={LOGO_ACCEPT}
                      className="visually-hidden"
                      onChange={onFileChange}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={processing}
                      onClick={() => fileInput.current?.click()}
                    >
                      {processing ? (
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      ) : (
                        <i className="bi bi-upload me-2" aria-hidden="true" />
                      )}
                      {logo ? t('branding.replaceLogo') : t('branding.uploadLogo')}
                    </button>
                    {logo && (
                      <button type="button" className="btn btn-outline-danger" onClick={() => edit(setLogo)(null)}>
                        <i className="bi bi-trash me-2" aria-hidden="true" />
                        {t('branding.removeLogo')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="form-text">{t('branding.logoHint', { size: LOGO_MAX_BYTES / 1024 / 1024 })}</div>
                {error && (
                  <div className="alert alert-danger py-2 small mt-2 mb-0" role="alert">
                    {error}
                  </div>
                )}
              </div>

              {logo && (
                <fieldset>
                  <legend className="form-label fw-medium fs-6 mb-2">{t('branding.onDark.label')}</legend>
                  <div className="btn-group flex-wrap" role="radiogroup">
                    {onDarkOptions.map((option) => {
                      const id = `${onDarkName}-${option.value}`
                      return (
                        <Fragment key={option.value}>
                          <input
                            id={id}
                            type="radio"
                            className="btn-check"
                            name={onDarkName}
                            checked={logoOnDark === option.value}
                            onChange={() => edit(setLogoOnDark)(option.value)}
                          />
                          <label htmlFor={id} className="btn btn-outline-secondary">
                            <i className={`bi ${option.icon} me-2`} aria-hidden="true" />
                            {t(`branding.onDark.${option.value}`)}
                          </label>
                        </Fragment>
                      )
                    })}
                  </div>
                  <div className="form-text">{t('branding.onDark.hint')}</div>
                </fieldset>
              )}
            </div>

            <div className="card-footer bg-body d-flex flex-wrap align-items-center gap-2">
              <button type="submit" className="btn btn-primary" disabled={!dirty || processing}>
                {t('branding.save')}
              </button>
              <button type="button" className="btn btn-link text-body-secondary" onClick={onReset}>
                {t('branding.reset')}
              </button>
              {saved && !dirty && (
                <span className="small text-body-secondary ms-auto" role="status">
                  <i className="bi bi-check2 me-1" aria-hidden="true" />
                  {t('branding.saved')}
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card h-100">
            <div className="card-body d-flex flex-column gap-3">
              <h2 className="h6 fw-semibold mb-0">{t('branding.preview')}</h2>
              <div>
                <div className="small text-body-secondary mb-1">{t('branding.previewDark')}</div>
                <div data-bs-theme="dark" className={`${styles.preview} ${styles.dark}`}>
                  {preview}
                </div>
              </div>
              <div>
                <div className="small text-body-secondary mb-1">{t('branding.previewLight')}</div>
                <div className={`${styles.preview} border`}>{preview}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
