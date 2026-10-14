import type { ReactNode } from 'react'
import { toneVariant, type BadgeTone } from './tones'

type StatusBadgeProps = {
  tone?: BadgeTone
  children: ReactNode
}

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  const variant = toneVariant[tone]
  return (
    <span className={`badge rounded bg-${variant}-subtle text-${variant}-emphasis border border-${variant}-subtle`}>
      {children}
    </span>
  )
}
