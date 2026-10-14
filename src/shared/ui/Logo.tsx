import styles from './Logo.module.css'

/** How a custom logo is drawn inside dark areas (data-bs-theme="dark"). */
export type LogoOnDark = 'original' | 'white' | 'frame'
/** "emblem" = square-ish mark shown with the name beside it; "wide" = wordmark shown at full width. */
export type LogoShape = 'emblem' | 'wide'

type LogoProps = {
  size?: 'md' | 'lg'
  /** Show only the mark, without the name. */
  compact?: boolean
  /** Custom logo image (URL or data URL). Falls back to the PharmaSales mark. */
  src?: string | null
  shape?: LogoShape
  /** Custom name shown with the logo. Falls back to "PharmaSales". */
  name?: string
  onDark?: LogoOnDark
  /** Put a light logo on a dark tile in light areas, where it would otherwise be invisible. */
  darkTileOnLight?: boolean
}

const onDarkClass: Record<LogoOnDark, string | undefined> = {
  original: undefined,
  white: styles.white,
  frame: styles.frame,
}

export function Logo({
  size = 'md',
  compact = false,
  src,
  shape = 'emblem',
  name,
  onDark = 'original',
  darkTileOnLight = false,
}: LogoProps) {
  const label = name || 'PharmaSales'
  const wide = Boolean(src) && shape === 'wide' && !compact
  const classes = [
    styles.logo,
    size === 'lg' && styles.lg,
    compact && styles.compact,
    wide && styles.wide,
    wide && name && styles.stacked,
    src && onDarkClass[onDark],
    src && darkTileOnLight && styles.darkTile,
  ]
    .filter(Boolean)
    .join(' ')

  const mark = src ? (
    <span className={styles.imageBox}>
      <img src={src} alt={compact || !name ? label : ''} className={styles.image} />
    </span>
  ) : (
    <span className={styles.mark} aria-hidden="true">
      <i className="bi bi-capsule-pill" />
    </span>
  )

  if (compact) {
    return (
      <span className={classes}>
        {mark}
        {!src && <span className="visually-hidden">{label}</span>}
      </span>
    )
  }

  if (wide) {
    return (
      <span className={classes}>
        {mark}
        {name && <span className={`${styles.caption} text-truncate`}>{name}</span>}
      </span>
    )
  }

  return (
    <span className={classes}>
      {mark}
      {name ? (
        <span className={styles.name}>{name}</span>
      ) : (
        !src && (
          <span className={styles.wordmark}>
            Pharma<span className={styles.accent}>Sales</span>
          </span>
        )
      )}
    </span>
  )
}
