'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const REASONS = [
  'Spam or scam',
  'Misleading or fraudulent listing',
  'Prohibited item or service',
  'Harassment or abusive behavior',
  'Fake McGill student',
  'Other',
]

interface Props {
  listingId: string | null
  reportedUserId: string | null
}

export function ReportForm({ listingId, reportedUserId }: Props) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { setError('Please select a reason.'); return }

    setSubmitting(true)
    setError('')

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, reported_user_id: reportedUserId, reason, details }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    router.push('/?reported=1')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">Reason</label>
        <div className="grid gap-2">
          {REASONS.map(r => (
            <label key={r} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-red-700"
              />
              <span className="text-sm text-gray-700">{r}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-900">
          Additional details <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Provide any additional context that may help our team review this report..."
          className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
        />
        <p className="text-xs text-right text-gray-400">{details.length}/1000</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={submitting} className="w-full">
        Submit report
      </Button>

      <p className="text-xs text-center text-gray-400">
        False reports may result in account suspension.
      </p>
    </form>
  )
}
