export type BadgeTone = 'neutral' | 'accent' | 'success' | 'info' | 'warning' | 'danger'

export const toneVariant: Record<BadgeTone, string> = {
  neutral: 'secondary',
  accent: 'primary',
  success: 'success',
  info: 'info',
  warning: 'warning',
  danger: 'danger',
}
