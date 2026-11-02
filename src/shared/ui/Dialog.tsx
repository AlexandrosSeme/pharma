import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Dialog.module.css'

type DialogProps = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Modal dialog on the native <dialog>: Esc, focus trapping and the backdrop come from the browser. Mount it to open it. */
export function Dialog({ title, onClose, children, footer }: DialogProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className={`card ${styles.panel}`}>
        <div className="card-header bg-body d-flex align-items-center gap-3 py-3">
          <h2 id={titleId} className="h5 mb-0 flex-grow-1">
            {title}
          </h2>
          <button type="button" className="btn-close" aria-label={t('common.close')} onClick={onClose} />
        </div>
        <div className={`card-body ${styles.body}`}>{children}</div>
        {footer && <div className="card-footer bg-body d-flex flex-wrap gap-2 py-3">{footer}</div>}
      </div>
    </dialog>
  )
}
