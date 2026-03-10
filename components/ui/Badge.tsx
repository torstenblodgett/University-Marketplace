type Variant = 'verified' | 'category' | 'status' | 'neutral'

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  verified: 'bg-green-100 text-green-800 border border-green-200',
  category: 'bg-blue-50 text-blue-700 border border-blue-100',
  status:   'bg-yellow-50 text-yellow-700 border border-yellow-100',
  neutral:  'bg-gray-100 text-gray-600 border border-gray-200',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
