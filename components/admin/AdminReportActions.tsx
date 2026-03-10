'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { ReportStatus } from '@/types/database'

interface Props {
  reportId: string
  currentStatus: ReportStatus
  currentNotes: string
}

const STATUS_OPTIONS: Array<{ value: ReportStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

export function AdminReportActions({ reportId, currentStatus, currentNotes }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<ReportStatus>(currentStatus)
  const [notes, setNotes] = useState(currentNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)

    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes }),
    })

    setSaving(false)

    if (!res.ok) {
      setError('Failed to save. Please try again.')
      return
    }

    setSaved(true)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Admin Actions</h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ReportStatus)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1">
            Admin notes (private)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes about this report..."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-700"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-green-600">Saved.</p>}

      <Button onClick={handleSave} loading={saving} size="sm">
        Save changes
      </Button>
    </div>
  )
}
