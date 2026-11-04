import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { accountGroups, territoryText, type WatchFocus } from './scope'
import type { Role, TeamMember } from './types'
import { useScope } from './useScope'
import styles from './TeamWatch.module.css'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function Mark({ role, name }: { role: Role; name: string }) {
  return (
    <span className={`${styles.mark} ${styles[role]}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

/** Stays on the signed-in account. Picking a person only changes whose records are open. */
export function TeamWatch() {
  const { t, i18n } = useTranslation()
  const { user, role, members, focus, setFocus } = useScope()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user || role === 'rep') return null

  const lang = i18n.resolvedLanguage
  const groups = accountGroups(user)
  const directors = role === 'director' ? (groups.find((group) => group.role === 'director')?.members ?? []) : []
  const teams = groups.filter((group) => group.lead)
  const viewer = members.find((member) => member.id === user.id)

  const current = describe(focus, members, role)
  const currentMember = current.member
  const triggerName =
    current.kind === 'team'
      ? t('auth.wholeTeam')
      : currentMember
        ? currentMember.name
        : t(role === 'manager' ? 'visits.myTeam' : 'visits.allReps')
  const triggerRole: Role = current.kind === 'team' ? 'manager' : (currentMember?.role ?? role)

  const choose = (next: WatchFocus | null) => {
    setFocus(next)
    setOpen(false)
  }

  const allSelected = !focus
  const legend: Role[] = role === 'director' ? ['director', 'manager', 'rep'] : ['manager', 'rep']

  return (
    <div ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('auth.watch')}
        onClick={() => setOpen((value) => !value)}
      >
        <Mark role={triggerRole} name={currentMember?.name ?? user.name} />
        <span className={styles.triggerText}>
          <span className={styles.triggerName}>{triggerName}</span>
          <span className={styles.triggerMeta}>{t(`roles.short.${triggerRole}`)}</span>
        </span>
        <i className={`bi bi-chevron-down ${styles.chevron}`} aria-hidden="true" />
      </button>

      {open && (
        <div className={styles.menu} data-bs-theme="light" role="listbox" aria-label={t('auth.watch')}>
          <div className={styles.legend}>
            {legend.map((item) => (
              <span key={item} className={`${styles.pill} ${styles[item]}`}>
                {t(`roles.short.${item}`)}
              </span>
            ))}
          </div>

          <button
            type="button"
            role="option"
            className={styles.row}
            aria-selected={allSelected}
            onClick={() => choose(null)}
          >
            <Mark role={role} name={viewer?.name ?? user.name} />
            <span className={styles.copy}>
              <span className={styles.name}>{t(role === 'manager' ? 'visits.myTeam' : 'visits.allReps')}</span>
              <span className={styles.meta}>
                {t(`roles.${role}`)}
                {viewer ? ` · ${territoryText(viewer, lang)}` : ''}
              </span>
            </span>
            <span className={`${styles.pill} ${styles[role]}`}>{t(`roles.short.${role}`)}</span>
            <i className={`bi ${allSelected ? 'bi-check-lg' : ''} ${styles.check}`} aria-hidden="true" />
          </button>

          {directors.map((director) => (
            <MemberOption
              key={director.id}
              member={director}
              lang={lang}
              selected={focus?.kind === 'person' && focus.id === director.id}
              onChoose={(id) => choose({ kind: 'person', id })}
            />
          ))}

          {teams.map((group) => {
            const lead = group.lead!
            const reps = group.members.filter((member) => member.role === 'rep')
            const teamSelected = focus?.kind === 'team' && focus.managerId === lead.id
            return (
              <section key={group.id} className={styles.team}>
                {role === 'director' && (
                  <button
                    type="button"
                    role="option"
                    className={styles.row}
                    aria-selected={teamSelected}
                    onClick={() => choose({ kind: 'team', managerId: lead.id })}
                  >
                    <Mark role="manager" name={lead.name} />
                    <span className={styles.copy}>
                      <span className={styles.name}>{t('auth.wholeTeam')}</span>
                      <span className={styles.meta}>
                        {lead.name} · {territoryText(lead, lang)}
                      </span>
                    </span>
                    <span className={`${styles.pill} ${styles.manager}`}>{t('roles.short.manager')}</span>
                    <i className={`bi ${teamSelected ? 'bi-check-lg' : ''} ${styles.check}`} aria-hidden="true" />
                  </button>
                )}
                <MemberOption
                  member={lead}
                  lang={lang}
                  selected={focus?.kind === 'person' && focus.id === lead.id}
                  onChoose={(id) => choose({ kind: 'person', id })}
                />
                <div className={styles.reps}>
                  {reps.map((rep) => (
                    <MemberOption
                      key={rep.id}
                      member={rep}
                      lang={lang}
                      selected={focus?.kind === 'person' && focus.id === rep.id}
                      onChoose={(id) => choose({ kind: 'person', id })}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MemberOption({
  member,
  lang,
  selected,
  onChoose,
}: {
  member: TeamMember
  lang?: string
  selected: boolean
  onChoose: (id: string) => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      role="option"
      className={styles.row}
      aria-selected={selected}
      onClick={() => onChoose(member.id)}
    >
      <Mark role={member.role} name={member.name} />
      <span className={styles.copy}>
        <span className={styles.name}>{member.name}</span>
        <span className={styles.meta}>
          {t(`roles.${member.role}`)} · {territoryText(member, lang)}
        </span>
      </span>
      <span className={`${styles.pill} ${styles[member.role]}`}>{t(`roles.short.${member.role}`)}</span>
      <i className={`bi ${selected ? 'bi-check-lg' : ''} ${styles.check}`} aria-hidden="true" />
    </button>
  )
}

function describe(focus: WatchFocus | null, members: TeamMember[], role: Role) {
  if (!focus) return { kind: 'all' as const, member: undefined, role }
  if (focus.kind === 'team') {
    return { kind: 'team' as const, member: members.find((member) => member.id === focus.managerId), role: 'manager' as const }
  }
  const member = members.find((member) => member.id === focus.id)
  return { kind: 'person' as const, member, role: member?.role ?? role }
}
