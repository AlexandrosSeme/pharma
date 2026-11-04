import { useTranslation } from 'react-i18next'
import { localized } from '../lib/text'
import type { ClmDeck, ClmSlide } from '../types'
import styles from './SlideCanvas.module.css'

type SlideCanvasProps = {
  deck: ClmDeck
  slide: ClmSlide
  index: number
}

export function SlideCanvas({ deck, slide, index }: SlideCanvasProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  const kindClass =
    slide.kind === 'cover'
      ? styles.cover
      : slide.kind === 'message'
        ? styles.message
        : slide.kind === 'safety'
          ? styles.safety
          : slide.kind === 'ask'
            ? styles.ask
            : ''

  return (
    <article className={`${styles.slide} ${kindClass}`} aria-roledescription="slide">
      <div className={styles.head}>
        <img className={styles.pack} src={deck.image} alt={deck.productName} />
        <div className={styles.copy}>
          {slide.kicker && <p className={styles.kicker}>{localized(slide.kicker, lang)}</p>}
          <h2 className={styles.title}>{localized(slide.title, lang)}</h2>
        </div>
      </div>
      {slide.body && <p className={styles.body}>{localized(slide.body, lang)}</p>}
      {slide.points && (
        <ul className={styles.points}>
          {slide.points.map((point, pointIndex) => (
            <li key={point.en}>
              <span className={styles.index}>{pointIndex + 1}</span>
              <span>{localized(point, lang)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.spacer} />
      <footer className={styles.footer}>
        <span>{deck.productName}</span>
        <span>
          {deck.code} · {index + 1}/{deck.slides.length} · {t('clm.demoAid')}
        </span>
      </footer>
    </article>
  )
}
