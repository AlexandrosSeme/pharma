export type Localized = { en: string; el: string }

export type ClmAudience = 'hcp' | 'pharmacy'

export type SlideKind = 'cover' | 'message' | 'points' | 'safety' | 'ask'

export type ClmSlide = {
  id: string
  kind: SlideKind
  kicker?: Localized
  title: Localized
  body?: Localized
  points?: Localized[]
  note: Localized
}

export type ClmDeck = {
  id: string
  code: string
  productName: string
  audience: ClmAudience
  approvedUntil: string
  version: string
  title: Localized
  image: string
  slides: ClmSlide[]
}

export const slideReactions = ['interested', 'question', 'concern', 'neutral'] as const
export type SlideReaction = (typeof slideReactions)[number]

export type ClmSlideView = {
  slideId: string
  seconds: number
  reaction?: SlideReaction
  feedback?: string
}

export type ClmSession = {
  id: string
  deckId: string
  customerId: string
  customerName: string
  repName: string
  startedAt: string
  endedAt: string
  slides: ClmSlideView[]
  followUp: boolean
  note: string
}

export type NewClmSession = Omit<ClmSession, 'id'>

export const EXPIRING_WITHIN_DAYS = 45
