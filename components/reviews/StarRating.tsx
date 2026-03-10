interface Props {
  rating: number      // 1-5, supports decimals for display
  size?: 'sm' | 'md'
}

export function StarRating({ rating, size = 'md' }: Props) {
  const stars = [1, 2, 3, 4, 5]
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <span className={`inline-flex gap-0.5 ${sizeClass}`} aria-label={`${rating} out of 5 stars`}>
      {stars.map(star => {
        const filled = rating >= star
        const half = !filled && rating >= star - 0.5
        return (
          <span key={star} className={filled || half ? 'text-yellow-400' : 'text-gray-200'}>
            {half ? '½' : '★'}
          </span>
        )
      })}
    </span>
  )
}

interface InputProps {
  value: number
  onChange: (val: number) => void
}

export function StarRatingInput({ value, onChange }: InputProps) {
  return (
    <div className="flex gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${
            value >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'
          }`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
