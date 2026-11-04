import { localized } from './text'
import { slideReactions, type ClmDeck, type ClmSession, type SlideReaction } from '../types'

export type ProductFeedback = {
  id: string
  productName: string
  calls: number
  followUps: number
  shown: number
  possible: number
  reactions: Record<SlideReaction, number>
}

export type FeedbackLine = {
  id: string
  endedAt: string
  productName: string
  customerName: string
  repName: string
  slideTitle: string
  reaction?: SlideReaction
  feedback: string
}

export function productFeedback(decks: ClmDeck[], sessions: ClmSession[], deckId = ''): ProductFeedback[] {
  const rows = new Map<string, ProductFeedback>()
  for (const deck of decks) {
    if (deckId && deck.id !== deckId) continue
    rows.set(deck.id, {
      id: deck.id,
      productName: deck.productName,
      calls: 0,
      followUps: 0,
      shown: 0,
      possible: 0,
      reactions: { interested: 0, question: 0, concern: 0, neutral: 0 },
    })
  }

  for (const session of sessions) {
    if (deckId && session.deckId !== deckId) continue
    const row = rows.get(session.deckId)
    const deck = decks.find((item) => item.id === session.deckId)
    if (!row || !deck) continue
    row.calls += 1
    if (session.followUp) row.followUps += 1
    row.shown += session.slides.length
    row.possible += deck.slides.length
    for (const view of session.slides) {
      if (view.reaction) row.reactions[view.reaction] += 1
    }
  }

  return [...rows.values()].sort((a, b) => b.calls - a.calls || a.productName.localeCompare(b.productName))
}

export function feedbackLines(decks: ClmDeck[], sessions: ClmSession[], deckId: string, lang?: string): FeedbackLine[] {
  const lines: FeedbackLine[] = []
  for (const session of sessions) {
    if (deckId && session.deckId !== deckId) continue
    const deck = decks.find((item) => item.id === session.deckId)
    if (!deck) continue
    for (const view of session.slides) {
      if (!view.feedback?.trim()) continue
      const slide = deck.slides.find((item) => item.id === view.slideId)
      lines.push({
        id: `${session.id}-${view.slideId}`,
        endedAt: session.endedAt,
        productName: deck.productName,
        customerName: session.customerName,
        repName: session.repName,
        slideTitle: slide ? localized(slide.title, lang) : view.slideId,
        reaction: view.reaction,
        feedback: view.feedback,
      })
    }
  }
  return lines.sort((a, b) => b.endedAt.localeCompare(a.endedAt))
}

export function reactionTotals(rows: ProductFeedback[]) {
  return slideReactions.map((reaction) => rows.reduce((sum, row) => sum + row.reactions[reaction], 0))
}
