import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { territoryName, useTerritories } from "@/features/territories";
import { accountGroups, territoryText, type WatchFocus } from "./scope";
import type { Role, TeamMember } from "./types";
import { useScope } from "./useScope";
import styles from "./TeamWatch.module.css";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Mark({ role, name }: { role: Role; name: string }) {
  return (
    <span className={`${styles.mark} ${styles[role]}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function defaultOpenIds(
  focus: WatchFocus | null,
  members: TeamMember[],
  role: Role,
  userId: string,
) {
  if (focus?.kind === "team") return [focus.managerId];
  if (focus?.kind === "person") {
    const person = members.find((member) => member.id === focus.id);
    if (person?.role === "rep" && person.managerId) return [person.managerId];
    if (person?.role === "manager") return [person.id];
  }
  if (role === "manager") return [userId];
  return [];
}

/** Stays on the signed-in account. Picking a person only changes whose records are open. */
export function TeamWatch() {
  const { t, i18n } = useTranslation();
  const { user, role, members, focus, setFocus } = useScope();
  const territories = useTerritories();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user || role === "rep") return null;

  const lang = i18n.resolvedLanguage;
  const brickLabel = (member: TeamMember) => {
    if (member.role !== "rep") return territoryText(member, lang);
    const names = (territories.data ?? [])
      .filter((territory) => territory.repId === member.id)
      .map((territory) => territoryName(territory.name, lang));
    return names.length ? names.join(" · ") : territoryText(member, lang);
  };
  const groups = accountGroups(user);
  const directors =
    role === "director"
      ? (groups.find((group) => group.role === "director")?.members ?? [])
      : [];
  const teams = groups.filter((group) => group.lead);
  const viewer = members.find((member) => member.id === user.id);
  const needle = query.trim().toLowerCase();
  const hit = (member: TeamMember, label: string) =>
    !needle || `${member.name} ${label}`.toLowerCase().includes(needle);
  const directorRows = directors.filter((director) =>
    hit(director, brickLabel(director)),
  );
  const teamRows = teams.flatMap((group) => {
    const lead = group.lead;
    if (!lead) return [];
    const reps = group.members.filter((member) => member.role === "rep");
    const leadLabel = brickLabel(lead);
    const visibleReps =
      needle && !hit(lead, leadLabel)
        ? reps.filter((rep) => hit(rep, brickLabel(rep)))
        : reps;
    if (needle && !hit(lead, leadLabel) && visibleReps.length === 0) return [];
    return [{ id: lead.id, lead, leadLabel, reps, visibleReps }];
  });

  const current = describe(focus, members, role);
  const currentMember = current.member;
  const triggerName =
    current.kind === "team"
      ? t("auth.wholeTeam")
      : currentMember
        ? currentMember.name
        : t(role === "manager" ? "visits.myTeam" : "visits.allReps");
  const triggerRole: Role =
    current.kind === "team" ? "manager" : (currentMember?.role ?? role);

  const choose = (next: WatchFocus | null) => {
    setFocus(next);
    setOpen(false);
  };

  const allSelected = !focus;
  const searching = needle.length > 0;

  const openMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery("");
    setOpenIds(defaultOpenIds(focus, members, role, user.id));
    setOpen(true);
  };

  return (
    <div ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("auth.watch")}
        onClick={openMenu}
      >
        <Mark role={triggerRole} name={currentMember?.name ?? user.name} />
        <span className={styles.triggerText}>
          <span className={styles.triggerName}>{triggerName}</span>
          <span className={styles.triggerMeta}>
            {t(`roles.short.${triggerRole}`)}
          </span>
        </span>
        <i
          className={`bi bi-chevron-down ${styles.chevron}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className={styles.menu}
          data-bs-theme="light"
          role="dialog"
          aria-label={t("auth.watch")}
        >
          <label className={styles.search}>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              placeholder={t("auth.searchPeople")}
              aria-label={t("auth.searchPeople")}
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                className={styles.clear}
                onClick={() => setQuery("")}
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
                <span className="visually-hidden">
                  {t("auth.searchPeople")}
                </span>
              </button>
            )}
          </label>

          {!searching && (
            <button
              type="button"
              className={styles.row}
              aria-pressed={allSelected}
              onClick={() => choose(null)}
            >
              <Mark role={role} name={viewer?.name ?? user.name} />
              <span className={styles.copy}>
                <span className={styles.name}>
                  {t(role === "manager" ? "visits.myTeam" : "visits.allReps")}
                </span>
                <span className={styles.meta}>
                  {t(`roles.${role}`)}
                  {viewer ? ` · ${territoryText(viewer, lang)}` : ""}
                </span>
              </span>
              <span className={`${styles.pill} ${styles[role]}`}>
                {t(`roles.short.${role}`)}
              </span>
              <i
                className={`bi ${allSelected ? "bi-check-lg" : ""} ${styles.check}`}
                aria-hidden="true"
              />
            </button>
          )}

          {directorRows.length > 0 && (
            <div className={styles.section}>
              {directorRows.map((director) => (
                <MemberOption
                  key={director.id}
                  member={director}
                  label={brickLabel(director)}
                  selected={
                    focus?.kind === "person" && focus.id === director.id
                  }
                  onChoose={(id) => choose({ kind: "person", id })}
                />
              ))}
            </div>
          )}

          {teamRows.map((team) => {
            const expanded = searching || openIds.includes(team.id);
            const panelId = `team-reps-${team.id}`;
            const active =
              (focus?.kind === "team" && focus.managerId === team.id) ||
              (focus?.kind === "person" &&
                (focus.id === team.lead.id ||
                  team.reps.some((rep) => rep.id === focus.id)));
            return (
              <section key={team.id} className={styles.section}>
                <button
                  type="button"
                  className={`${styles.head} ${active ? styles.headActive : ""}`}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => {
                    if (searching) return;
                    setOpenIds((current) =>
                      current.includes(team.id) ? [] : [team.id],
                    );
                  }}
                >
                  <i
                    className={`bi ${expanded ? "bi-chevron-down" : "bi-chevron-right"} ${styles.twist}`}
                    aria-hidden="true"
                  />
                  <Mark role="manager" name={team.lead.name} />
                  <span className={styles.copy}>
                    <span className={styles.name}>{team.lead.name}</span>
                    <span className={styles.meta}>{team.leadLabel}</span>
                  </span>
                  <span className={styles.count}>{team.reps.length}</span>
                  <span className="visually-hidden">
                    {expanded ? t("auth.hideReps") : t("auth.showReps")}
                    {", "}
                    {t("auth.repCount", { count: team.reps.length })}
                  </span>
                </button>
                {expanded && (
                  <div
                    id={panelId}
                    className={styles.panel}
                    role="group"
                    aria-label={team.lead.name}
                  >
                    {role === "director" && !searching && (
                      <button
                        type="button"
                        className={styles.row}
                        aria-pressed={
                          focus?.kind === "team" && focus.managerId === team.id
                        }
                        onClick={() =>
                          choose({ kind: "team", managerId: team.id })
                        }
                      >
                        <Mark role="manager" name={team.lead.name} />
                        <span className={styles.copy}>
                          <span className={styles.name}>
                            {t("auth.wholeTeam")}
                          </span>
                          <span className={styles.meta}>{team.lead.name}</span>
                        </span>
                        <i
                          className={`bi ${focus?.kind === "team" && focus.managerId === team.id ? "bi-check-lg" : ""} ${styles.check}`}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                    {(!searching || hit(team.lead, team.leadLabel)) && (
                      <MemberOption
                        member={team.lead}
                        label={team.leadLabel}
                        selected={
                          focus?.kind === "person" && focus.id === team.lead.id
                        }
                        onChoose={(id) => choose({ kind: "person", id })}
                      />
                    )}
                    {team.visibleReps.map((rep) => (
                      <MemberOption
                        key={rep.id}
                        member={rep}
                        label={brickLabel(rep)}
                        compact
                        selected={
                          focus?.kind === "person" && focus.id === rep.id
                        }
                        onChoose={(id) => choose({ kind: "person", id })}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {searching && directorRows.length === 0 && teamRows.length === 0 && (
            <p className={styles.empty}>{t("auth.noMatch")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MemberOption({
  member,
  label,
  selected,
  compact = false,
  onChoose,
}: {
  member: TeamMember;
  label: string;
  selected: boolean;
  compact?: boolean;
  onChoose: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={styles.row}
      aria-pressed={selected}
      onClick={() => onChoose(member.id)}
    >
      <Mark role={member.role} name={member.name} />
      <span className={styles.copy}>
        <span className={styles.name}>{member.name}</span>
        <span className={styles.meta}>
          {compact ? label : `${t(`roles.${member.role}`)} · ${label}`}
        </span>
      </span>
      {!compact && (
        <span className={`${styles.pill} ${styles[member.role]}`}>
          {t(`roles.short.${member.role}`)}
        </span>
      )}
      <i
        className={`bi ${selected ? "bi-check-lg" : ""} ${styles.check}`}
        aria-hidden="true"
      />
    </button>
  );
}

function describe(focus: WatchFocus | null, members: TeamMember[], role: Role) {
  if (!focus) return { kind: "all" as const, member: undefined, role };
  if (focus.kind === "team") {
    return {
      kind: "team" as const,
      member: members.find((member) => member.id === focus.managerId),
      role: "manager" as const,
    };
  }
  const member = members.find((member) => member.id === focus.id);
  return { kind: "person" as const, member, role: member?.role ?? role };
}
