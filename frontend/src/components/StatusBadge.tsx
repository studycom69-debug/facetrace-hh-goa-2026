interface StatusBadgeProps {
  tone: 'neutral' | 'success' | 'danger' | 'warning' | 'accent'
  children: React.ReactNode
}

const toneClasses: Record<StatusBadgeProps['tone'], string> = {
  neutral: 'bg-surface-container text-on-surface-variant border-outline-variant/60',
  success: 'bg-secondary-container text-on-secondary-container border-secondary-container',
  danger: 'bg-error-container text-on-error-container border-error-container',
  warning: 'bg-warning-soft text-warning border-outline-variant/60',
  accent: 'bg-surface-container-high text-on-surface border-outline-variant/60',
}

export default function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
