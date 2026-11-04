import styles from './controls.module.css'

export type SelectOption = {
  value: string
  label: string
}

export type SelectGroup = {
  label: string
  options: SelectOption[]
}

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  groups?: SelectGroup[]
  disabled?: boolean
  'aria-label'?: string
}

export function Select({ value, onChange, options, groups = [], disabled, ...rest }: SelectProps) {
  return (
    <select
      className={`form-select ${styles.select}`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
