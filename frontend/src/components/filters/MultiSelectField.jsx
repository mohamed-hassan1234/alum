import Select from 'react-select'
import { useMemo } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function MultiSelectField({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isClearable = true,
  className,
  isMulti = true,
}) {
  const { theme } = useTheme()

  const styles = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      control: (base, state) => ({
        ...base,
        minHeight: 42,
        borderRadius: 12,
        borderColor: state.isFocused
          ? 'rgba(49,165,214,0.6)'
          : isDark
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(15,23,42,0.08)',
        backgroundColor: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.7)',
        boxShadow: 'none',
      }),
      menu: (base) => ({
        ...base,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: isDark ? 'rgb(15,23,42)' : 'white',
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.08)',
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#1c9d56'
          : state.isFocused
            ? isDark
              ? 'rgba(49,165,214,0.2)'
              : 'rgba(49,165,214,0.12)'
            : 'transparent',
      }),
      multiValue: (base) => ({
        ...base,
        borderRadius: 999,
        backgroundColor: 'rgba(28,157,86,0.14)',
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: isDark ? '#d1fae5' : '#065f46',
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? '#e2e8f0' : '#0f172a',
      }),
      input: (base) => ({
        ...base,
        color: isDark ? '#e2e8f0' : '#0f172a',
      }),
    }
  }, [theme])

  return (
    <label className={className}>
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-[rgb(var(--text))]">{label}</span>
      ) : null}
      <Select
        isMulti={isMulti}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={styles}
      />
    </label>
  )
}

