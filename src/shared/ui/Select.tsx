import styles from './controls.module.css'

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  'aria-label'?: string
}

export function Select({ value, onChange, options, ...rest }: SelectProps) {
  return (
    <select
      className={`form-select ${styles.select}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
