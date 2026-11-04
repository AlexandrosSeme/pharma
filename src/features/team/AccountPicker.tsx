import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/useAuth'
import { accountGroups, territoryText } from './scope'
import type { Role, TeamMember } from './types'

type AccountPickerProps = {
  onSelect: (member: TeamMember) => void
  /** Limits the list to the people this signed-in user may open. Omit it on the login screen. */
  viewer?: { id: string; role: Role } | null
}

export function AccountPicker({ onSelect, viewer }: AccountPickerProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const groups = accountGroups(viewer)

  if (groups.length === 0) return null

  return (
    <div className="d-flex flex-column gap-3" style={{ maxHeight: '22rem', overflow: 'auto' }}>
      {groups.map((group) => (
        <section key={group.id}>
          <h2 className="small fw-semibold text-body-secondary text-uppercase mb-1" style={{ letterSpacing: '0.04em' }}>
            {group.lead ? t('auth.teamOf', { name: group.lead.name }) : t(`roles.${group.role}`)}
          </h2>
          {group.lead && (
            <p className="small text-body-secondary mb-1">{territoryText(group.lead, i18n.resolvedLanguage)}</p>
          )}
          <div className="d-flex flex-column gap-1">
            {group.members.map((member) => {
              const current = user?.id === member.id
              return (
                <button
                  key={member.id}
                  type="button"
                  className={`btn btn-sm text-start d-flex justify-content-between align-items-center gap-2 ${current ? 'btn-primary' : 'btn-outline-secondary'}`}
                  aria-current={current ? 'true' : undefined}
                  onClick={() => onSelect(member)}
                >
                  <span className="text-truncate">
                    <span className="d-block fw-semibold text-truncate">{member.name}</span>
                    <span className={`d-block small text-truncate ${current ? 'text-white-50' : 'text-body-secondary'}`}>
                      {territoryText(member, i18n.resolvedLanguage)}
                    </span>
                  </span>
                  <span className="small text-nowrap">{t(`roles.${member.role}`)}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
