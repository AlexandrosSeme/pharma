import { useTranslation } from 'react-i18next'
import { subtitleKey, territoryText } from './scope'
import { useScope } from './useScope'

/** Page subtitle for the signed-in role, or the person/team whose book is open. */
export function useWatchSubtitle(section: string) {
  const { t, i18n } = useTranslation()
  const { role, focus, watched } = useScope()
  if (!focus) return t(subtitleKey(role, section))

  if (focus.kind === 'team') {
    const lead = watched.find((member) => member.id === focus.managerId)
    if (!lead) return t(subtitleKey(role, section))
    return t('auth.watchingTeam', { name: lead.name, territory: territoryText(lead, i18n.resolvedLanguage) })
  }

  const person = watched.find((member) => member.id === focus.id) ?? watched[0]
  if (!person) return t(subtitleKey(role, section))
  return t('auth.watchingPerson', {
    name: person.name,
    role: t(`roles.${person.role}`),
    territory: territoryText(person, i18n.resolvedLanguage),
  })
}
