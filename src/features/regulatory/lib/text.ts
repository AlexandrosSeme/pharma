import type { Localized } from '../types'

export function localized(value: Localized, lang: string | undefined) {
  return lang?.startsWith('el') ? value.el : value.en
}
