interface MaterialIconProps {
  name: string
  className?: string
  filled?: boolean
  size?: number
}

export default function MaterialIcon({
  name,
  className = '',
  filled = false,
  size = 20,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
